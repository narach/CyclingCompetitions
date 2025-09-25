'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { Pool } = require('pg');

const ssm = new SSMClient({});
let pool; // Reused across Lambda invocations in same container

async function getParameter(name, withDecryption = true) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: withDecryption });
  const resp = await ssm.send(cmd);
  return resp.Parameter?.Value;
}

async function getPool() {
  if (pool) return pool;
  const dbParam = process.env.SSM_DB_URL_PARAM;
  if (!dbParam) throw new Error('Missing SSM_DB_URL_PARAM');
  const dbUrl = await getParameter(dbParam, true);
  if (!dbUrl) throw new Error('Database URL not found in SSM');
  const max = Number(process.env.DB_MAX_POOL || '2');
  pool = new Pool({ connectionString: dbUrl, max, idleTimeoutMillis: 5_000 });
  return pool;
}

function parseBody(event) {
  if (!event?.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return {};
  }
}

function httpResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bodyObj),
  };
}

exports.handler = async (event) => {
  try {
    const body = parseBody(event);

    const { event_name, event_time, event_description, route, event_start } = body || {};

    if (!event_name || !event_time || !route) {
      return httpResponse(400, { error: 'event_name, event_time, and route are required' });
    }

    // Convert event_time to timestamp with timezone using Postgres
    const client = await (await getPool()).connect();
    try {
      const insertSql = `
        insert into events (event_name, event_time, event_description, route, event_start)
        values ($1, $2::timestamptz, $3, $4, $5)
        returning id, event_name, event_time, event_description, route, event_start, created_at, updated_at
      `;
      const params = [event_name, event_time, event_description ?? null, route, event_start ?? null];
      const { rows } = await client.query(insertSql, params);
      return httpResponse(201, { event: rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return httpResponse(500, { error: 'Internal Server Error' });
  }
};


