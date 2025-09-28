import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'
import Busboy, { BusboyConfig } from 'busboy'
import { Readable } from 'stream'
import { Pool } from 'pg'
import { XMLParser } from 'fast-xml-parser'

const ssm = new SSMClient({})
const s3 = new S3Client({})
let pool: Pool | undefined
let adminSecret: string | undefined

async function getParameter(name: string, withDecryption = true): Promise<string | undefined> {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: withDecryption })
  const resp = await ssm.send(cmd)
  return resp.Parameter?.Value
}

async function getPool(): Promise<Pool> {
  if (pool) return pool
  const dbParam = process.env.SSM_DB_URL_PARAM
  if (!dbParam) throw new Error('Missing SSM_DB_URL_PARAM')
  const dbUrl = await getParameter(dbParam, true)
  if (!dbUrl) throw new Error('Database URL not found in SSM')
  const max = Number(process.env.DB_MAX_POOL || '2')
  pool = new Pool({ connectionString: dbUrl, max, idleTimeoutMillis: 5_000 })
  return pool
}

function httpResponse(statusCode: number, bodyObj: unknown) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(bodyObj) }
}

function getHeader(headers: any, name: string) {
  if (!headers) return undefined
  const entries = Object.entries(headers)
  const found = entries.find(([k]) => String(k).toLowerCase() === String(name).toLowerCase())
  return found ? found[1] : undefined
}

function getBearerToken(event: any) {
  const auth = getHeader(event.headers, 'authorization')
  if (!auth) return null
  const m = /^Bearer\s+(.+)$/i.exec(String(auth))
  return m ? m[1] : null
}

async function ensureAdminSecret(): Promise<string> {
  if (adminSecret) return adminSecret
  const passParam = process.env.SSM_ADMIN_PASSWORD_PARAM
  if (!passParam) throw new Error('Missing SSM_ADMIN_PASSWORD_PARAM')
  adminSecret = await getParameter(passParam, true)
  if (!adminSecret) throw new Error('Admin password not found in SSM')
  return adminSecret
}

async function isAuthorizedAdmin(event: any) {
  try {
    const token = getBearerToken(event)
    if (!token) return false
    const secret = await ensureAdminSecret()
    jwt.verify(token, secret, { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

type UploadedFile = { filename: string, contentType: string, buffer: Buffer }

async function parseMultipartForm(event: any): Promise<{ fields: Record<string, string>, file: UploadedFile | null } | null> {
  const contentType = getHeader(event.headers, 'content-type')
  if (!contentType || !String(contentType).toLowerCase().startsWith('multipart/form-data')) return null

  const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8')
  const bb = Busboy({ headers: { 'content-type': contentType } } as BusboyConfig)

  const fields: Record<string, string> = {}
  let file: UploadedFile | null = null

  return await new Promise((resolve, reject) => {
    bb.on('file', (fieldname: string, fileStream: NodeJS.ReadableStream, filename: any, encoding: string, mimetype: string) => {
      const chunks: Buffer[] = []
      fileStream.on('data', (d: any) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
      fileStream.on('end', () => {
        if (fieldname === 'route' && !file) {
          const safeName = typeof filename === 'string' && filename.trim() ? filename : 'route.gpx'
          file = { filename: safeName, contentType: mimetype || 'application/gpx+xml', buffer: Buffer.concat(chunks) }
        }
      })
    })
    bb.on('field', (name: string, val: string) => { fields[name] = val })
    bb.on('error', (err: any) => reject(err))
    bb.on('finish', () => resolve({ fields, file }))

    Readable.from(bodyBuffer).pipe(bb)
  })
}

function slugify(input: string) {
  return String(input || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80)
}

function ensureGpxFilename(filenameBase: string) {
  const name = String(filenameBase || 'route')
  if (/\.gpx$/i.test(name)) return name
  return `${name}.gpx`
}

async function uploadRouteToS3(routeFile: { filename: string, contentType: string, buffer: Buffer }) {
  const bucket = process.env.ROUTES_BUCKET
  if (!bucket) throw new Error('Missing ROUTES_BUCKET')
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-central-1'
  const time = new Date()
  const y = time.getUTCFullYear()
  const m = String(time.getUTCMonth() + 1).padStart(2, '0')
  const ts = time.getTime()
  const rand = Math.random().toString(36).slice(2, 8)
  const base = slugify(routeFile.filename || 'route')
  const key = `routes/${y}/${m}/${ts}-${rand}-${ensureGpxFilename(base)}`
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: routeFile.buffer, ContentType: routeFile.contentType || 'application/gpx+xml' }))
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  return { bucket, key, url }
}

function computeDistanceMeters(points: {lat: number|null, lon: number|null, ele: number|null}[]) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371000
  let d = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) continue
    const lat1 = toRad(a.lat), lon1 = toRad(a.lon)
    const lat2 = toRad(b.lat), lon2 = toRad(b.lon)
    const dlat = lat2 - lat1
    const dlon = lon2 - lon1
    const sa = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa))
    d += R * c
  }
  return Math.round(d)
}

function extractRouteStatsFromGpxBuffer(buffer: Buffer) {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
    const xml = parser.parse(buffer.toString('utf8'))
    const trk = xml?.gpx?.trk
    const seg = Array.isArray(trk?.trkseg) ? trk.trkseg[0] : trk?.trkseg
    const trkpts = seg?.trkpt || []
    const arr = (Array.isArray(trkpts) ? trkpts : [trkpts])
    const points = arr.map((p: any) => ({ lat: p?.lat != null ? Number(p.lat) : null, lon: p?.lon != null ? Number(p.lon) : null, ele: p?.ele != null ? Number(p.ele) : null })).filter((p: any) => p.lat != null && p.lon != null)
    let ascent = 0, descent = 0
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      if (prev.ele != null && curr.ele != null) {
        const diff = curr.ele - prev.ele
        if (diff > 0) ascent += diff; else descent += -diff
      }
    }
    const distance = computeDistanceMeters(points)
    return { distance_m: distance, ascent_m: Math.round(ascent), descent_m: Math.round(descent) }
  } catch {
    return { distance_m: 0, ascent_m: 0, descent_m: 0 }
  }
}

export const handler = async (event: any) => {
  try {
    const ok = await isAuthorizedAdmin(event)
    if (!ok) return httpResponse(403, { error: 'Unauthorized' })

    const contentType = getHeader(event.headers, 'content-type') as string | undefined
    let event_name: string | undefined, event_time: string | undefined, event_description: string | null | undefined, event_start: string | null | undefined, route: string | null | undefined
    let parsedMultipart: { fields: any, file: { filename: string, contentType: string, buffer: Buffer } | null } | null = null

    if (contentType && contentType.toLowerCase().startsWith('multipart/form-data')) {
      parsedMultipart = await parseMultipartForm(event)
      event_name = parsedMultipart?.fields?.event_name
      event_time = parsedMultipart?.fields?.event_time
      event_description = parsedMultipart?.fields?.event_description || null
      event_start = parsedMultipart?.fields?.event_start || null
      route = null
    } else {
      let data: any = {}
      if (typeof event.body === 'string') {
        try { data = JSON.parse(event.body) } catch {}
      } else if (event.body && typeof event.body === 'object') {
        data = event.body
      }
      event_name = data?.event_name
      event_time = data?.event_time
      event_description = data?.event_description ?? null
      event_start = data?.event_start ?? null
      route = data?.route ?? null
    }

    if (!event_name || !event_time) return httpResponse(400, { error: 'event_name and event_time are required' })

    if (parsedMultipart) {
      const file = parsedMultipart.file
      if (!file || !file.buffer || file.buffer.length === 0) return httpResponse(400, { error: 'route GPX file is required' })
      const uploaded = await uploadRouteToS3(file)
      route = uploaded.url
      const stats = extractRouteStatsFromGpxBuffer(file.buffer)
      const client = await (await getPool()).connect()
      try {
        await client.query('begin')
        const insertEventSql = `
          insert into events (event_name, event_time, event_description, route, event_start)
          values ($1, $2::timestamptz, $3, $4, $5)
          returning id, event_name, event_time, event_description, route, event_start, created_at, updated_at
        `
        const evParams = [event_name, event_time, event_description ?? null, route, event_start ?? null]
        const { rows: evRows } = await client.query(insertEventSql, evParams)
        const eventRow = evRows[0]
        const nameNoExt = parsedMultipart?.fields?.route_name?.toString()?.trim() || 'route'
        const insertRouteSql = `
          insert into routes (route_name, distance_m, ascent_m, descent_m, route_url)
          values ($1, $2, $3, $4, $5)
          returning id
        `
        const { rows: routeRows } = await client.query(insertRouteSql, [nameNoExt, stats.distance_m, stats.ascent_m, stats.descent_m, uploaded.url])
        const routeId = routeRows[0]?.id
        if (routeId) {
          await client.query('update events set route_id = $1 where id = $2', [routeId, eventRow.id])
        }
        await client.query('commit')
        return httpResponse(201, { event: eventRow })
      } catch (e) {
        try { await client.query('rollback') } catch {}
        throw e
      } finally {
        client.release()
      }
    } else {
      if (!route) return httpResponse(400, { error: 'route is required' })
      const client = await (await getPool()).connect()
      try {
        const insertSql = `
          insert into events (event_name, event_time, event_description, route, event_start)
          values ($1, $2::timestamptz, $3, $4, $5)
          returning id, event_name, event_time, event_description, route, event_start, created_at, updated_at
        `
        const params = [event_name, event_time, event_description ?? null, route, event_start ?? null]
        const { rows } = await client.query(insertSql, params)
        return httpResponse(201, { event: rows[0] })
      } finally {
        client.release()
      }
    }
  } catch (err) {
    console.error(err)
    return httpResponse(500, { error: 'Internal Server Error' })
  }
}
