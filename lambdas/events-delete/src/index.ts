import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
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

function parseS3KeyFromUrl(url: string) {
  try {
    const u = new URL(url)
    return decodeURIComponent(u.pathname.replace(/^\//, ''))
  } catch {
    return null
  }
}

export const handler = async (event: any) => {
  try {
    await requireAdmin(event)
    const id = event?.pathParameters?.id
    if (!id) return httpResponse(400, { error: 'id is required' })

    const client = await (await getPool()).connect()
    try {
      const found = await client.query('select route from events where id = $1', [Number(id)])
      const route: string | null = found.rows?.[0]?.route || null

      await client.query('delete from events where id = $1', [Number(id)])

      if (route) {
        const key = parseS3KeyFromUrl(route)
        const bucket = process.env.ROUTES_BUCKET
        if (key && bucket) {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        }
      }

      return httpResponse(204, {})
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error(err)
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') return httpResponse(403, { error: 'Unauthorized' })
    return httpResponse(500, { error: 'Internal Server Error' })
  }
}
