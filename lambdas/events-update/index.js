'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Busboy = require('busboy');
const { Readable } = require('stream');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const ssm = new SSMClient({});
const s3 = new S3Client({});
let pool;
let adminSecret;

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

function httpResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bodyObj),
  };
}

function getHeader(headers, name) {
  if (!headers) return undefined;
  const entries = Object.entries(headers);
  const found = entries.find(([k]) => String(k).toLowerCase() === String(name).toLowerCase());
  return found ? found[1] : undefined;
}

function getBearerToken(event) {
  const auth = getHeader(event.headers, 'authorization');
  if (!auth) return null;
  const m = /^Bearer\s+(.+)$/i.exec(String(auth));
  return m ? m[1] : null;
}

async function ensureAdminSecret() {
  if (adminSecret) return adminSecret;
  const passParam = process.env.SSM_ADMIN_PASSWORD_PARAM;
  if (!passParam) throw new Error('Missing SSM_ADMIN_PASSWORD_PARAM');
  adminSecret = await getParameter(passParam, true);
  if (!adminSecret) throw new Error('Admin password not found in SSM');
  return adminSecret;
}

async function requireAdmin(event) {
  const token = getBearerToken(event);
  if (!token) return false;
  const secret = await ensureAdminSecret();
  jwt.verify(token, secret, { algorithms: ['HS256'] });
  return true;
}

function parseBody(event) {
  if (!event?.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return {};
  }
}

async function parseMultipartForm(event) {
  const contentType = getHeader(event.headers, 'content-type');
  if (!contentType || !contentType.toLowerCase().startsWith('multipart/form-data')) return null;
  const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
  const bb = Busboy({ headers: { 'content-type': contentType } });
  const fields = {};
  let file = null;
  return await new Promise((resolve, reject) => {
    bb.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
      const chunks = [];
      fileStream.on('data', (d) => chunks.push(d));
      fileStream.on('end', () => {
        if (fieldname === 'route') {
          file = { filename: filename || 'route.gpx', contentType: mimetype || 'application/gpx+xml', buffer: Buffer.concat(chunks) };
        }
      });
    });
    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('error', reject);
    bb.on('finish', () => resolve({ fields, file }));
    Readable.from(bodyBuffer).pipe(bb);
  });
}

function slugify(input) {
  return String(input || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80);
}
function ensureGpxFilename(filenameBase) {
  const name = String(filenameBase || 'route');
  if (/\.gpx$/i.test(name)) return name;
  return `${name}.gpx`;
}
async function uploadRouteToS3(routeFile) {
  const bucket = process.env.ROUTES_BUCKET;
  if (!bucket) throw new Error('Missing ROUTES_BUCKET');
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-central-1';
  const time = new Date();
  const y = time.getUTCFullYear();
  const m = String(time.getUTCMonth() + 1).padStart(2, '0');
  const ts = time.getTime();
  const rand = Math.random().toString(36).slice(2, 8);
  const base = slugify(routeFile.filename || 'route');
  const key = `routes/${y}/${m}/${ts}-${rand}-${ensureGpxFilename(base)}`;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: routeFile.buffer, ContentType: routeFile.contentType || 'application/gpx+xml' }));
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { bucket, key, url };
}

exports.handler = async (event) => {
  try {
    await requireAdmin(event);
    const id = event?.pathParameters?.id;
    if (!id) return httpResponse(400, { error: 'id is required' });

    const contentType = getHeader(event.headers, 'content-type');
    let fields = null, file = null;
    if (contentType && contentType.toLowerCase().startsWith('multipart/form-data')) {
      const parsed = await parseMultipartForm(event);
      fields = parsed?.fields || {};
      file = parsed?.file || null;
    } else {
      fields = parseBody(event);
    }

    const updates = [];
    const params = [];
    if (fields.event_name) { updates.push(`event_name = $${updates.length + 1}`); params.push(fields.event_name); }
    if (fields.event_time) { updates.push(`event_time = $${updates.length + 1}::timestamptz`); params.push(fields.event_time); }
    if (fields.event_description !== undefined) { updates.push(`event_description = $${updates.length + 1}`); params.push(fields.event_description || null); }
    if (fields.event_start !== undefined) { updates.push(`event_start = $${updates.length + 1}`); params.push(fields.event_start || null); }

    if (file) {
      const uploaded = await uploadRouteToS3(file);
      updates.push(`route = $${updates.length + 1}`);
      params.push(uploaded.url);
    }

    if (updates.length === 0) return httpResponse(400, { error: 'No updates provided' });

    const client = await (await getPool()).connect();
    try {
      const sql = `update events set ${updates.join(', ')}, updated_at = now() where id = $${updates.length + 1} returning *`;
      params.push(Number(id));
      const { rows } = await client.query(sql, params);
      if (!rows[0]) return httpResponse(404, { error: 'Not found' });
      return httpResponse(200, { event: rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
      return httpResponse(403, { error: 'Unauthorized' });
    }
    return httpResponse(500, { error: 'Internal Server Error' });
  }
}


