import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { Pool } from 'pg'

const ssm = new SSMClient({})
let pool: Pool | undefined

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

function http(statusCode: number, bodyObj: unknown) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bodyObj)
  }
}

export const handler = async () => {
  try {
    const client = await (await getPool()).connect()
    try {
      const sql = `
        select id, event_name, event_time, event_description, route, event_start, created_at, updated_at
        from events
        order by event_time asc
      `
      const { rows } = await client.query(sql)
      return http(200, { events: rows })
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error(err)
    return http(500, { error: 'ServerError', message: err?.message || 'Internal Server Error' })
  }
}
