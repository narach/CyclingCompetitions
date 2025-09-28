import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import Busboy, { BusboyConfig } from 'busboy'
import { Readable } from 'stream'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

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

async function requireAdmin(event: any) {
  const token = getBearerToken(event)
  if (!token) return false
  const secret = await ensureAdminSecret()
  jwt.verify(token, secret, { algorithms: ['HS256'] })
  return true
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
    bb.on('file', (fieldname: string, fileStream: NodeJS.ReadableStream, filename: string, encoding: string, mimetype: string) => {
      const chunks: Buffer[] = []
      fileStream.on('data', (d: any) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
      fileStream.on('end', () => {
        if (fieldname === 'route') file = { filename: filename || 'route.gpx', contentType: mimetype || 'application/gpx+xml', buffer: Buffer.concat(chunks) }
      })
    })
    bb.on('field', (name: string, val: string) => { fields[name] = val })
    bb.on('error', (e: any) => reject(e))
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

export const handler = async (event: any) => {
  try {
    await requireAdmin(event)
    const id = event?.pathParameters?.id
    if (!id) return httpResponse(400, { error: 'id is required' })

    const contentType = getHeader(event.headers, 'content-type')
    let fields: Record<string, any> = {}, file: UploadedFile | null = null
    if (contentType && String(contentType).toLowerCase().startsWith('multipart/form-data')) {
      const parsed = await parseMultipartForm(event)
      fields = parsed?.fields || {}
      file = parsed?.file || null
    } else {
      try { fields = typeof event.body === 'string' ? (JSON.parse(event.body) as any) : ((event.body || {}) as any) } catch { fields = {} }
    }

    const updates: string[] = []
    const params: any[] = []
    if (fields.event_name) { updates.push(`event_name = $${updates.length + 1}`); params.push(fields.event_name) }
    if (fields.event_time) { updates.push(`event_time = $${updates.length + 1}::timestamptz`); params.push(fields.event_time) }
    if (fields.event_description !== undefined) { updates.push(`event_description = $${updates.length + 1}`); params.push(fields.event_description || null) }
    if (fields.event_start !== undefined) { updates.push(`event_start = $${updates.length + 1}`); params.push(fields.event_start || null) }

    if (file) {
      const uploaded = await uploadRouteToS3(file)
      updates.push(`route = $${updates.length + 1}`)
      params.push(uploaded.url)
    }

    if (updates.length === 0) return httpResponse(400, { error: 'No updates provided' })

    const client = await (await getPool()).connect()
    try {
      const sql = `update events set ${updates.join(', ')}, updated_at = now() where id = $${updates.length + 1} returning *`
      params.push(Number(id))
      const { rows } = await client.query(sql, params)
      if (!rows[0]) return httpResponse(404, { error: 'Not found' })
      return httpResponse(200, { event: rows[0] })
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error(err)
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') return httpResponse(403, { error: 'Unauthorized' })
    return httpResponse(500, { error: 'Internal Server Error' })
  }
}
