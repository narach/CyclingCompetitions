'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Busboy = require('busboy');
const { Readable } = require('stream');
const { Pool } = require('pg');

const ssm = new SSMClient({});
const s3 = new S3Client({});
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

function getHeader(headers, name) {
  if (!headers) return undefined;
  const entries = Object.entries(headers);
  const found = entries.find(([k]) => String(k).toLowerCase() === String(name).toLowerCase());
  return found ? found[1] : undefined;
}

async function parseMultipartForm(event) {
  const contentType = getHeader(event.headers, 'content-type');
  if (!contentType || !contentType.toLowerCase().startsWith('multipart/form-data')) return null;

  const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
  const bb = Busboy({ headers: { 'content-type': contentType } });

  const fields = {};
  let file = null; // { filename, contentType, buffer }

  const fileBuffers = [];

  return await new Promise((resolve, reject) => {
    bb.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
      // Expecting field name 'route'
      const chunks = [];
      fileStream.on('data', (d) => chunks.push(d));
      fileStream.on('limit', () => {});
      fileStream.on('end', () => {
        if (fieldname === 'route' && !file) {
          file = {
            filename: filename || 'route.gpx',
            contentType: mimetype || 'application/gpx+xml',
            buffer: Buffer.concat(chunks),
          };
        }
      });
    });
    bb.on('field', (name, val) => {
      fields[name] = val;
    });
    bb.on('error', (err) => reject(err));
    bb.on('finish', () => resolve({ fields, file }));

    Readable.from(bodyBuffer).pipe(bb);
  });
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
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

  const put = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: routeFile.buffer,
    ContentType: routeFile.contentType || 'application/gpx+xml',
  });
  await s3.send(put);

  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { bucket, key, url: publicUrl };
}

exports.handler = async (event) => {
  try {
    const contentType = getHeader(event.headers, 'content-type');
    let event_name, event_time, event_description, event_start, route;
    let parsedMultipart = null;
    if (contentType && contentType.toLowerCase().startsWith('multipart/form-data')) {
      parsedMultipart = await parseMultipartForm(event);
      event_name = parsedMultipart?.fields?.event_name;
      event_time = parsedMultipart?.fields?.event_time;
      event_description = parsedMultipart?.fields?.event_description || null;
      event_start = parsedMultipart?.fields?.event_start || null;
      route = null; // will set after S3 upload
    } else {
      const body = parseBody(event);
      ({ event_name, event_time, event_description, route, event_start } = body || {});
    }

    if (!event_name || !event_time) {
      return httpResponse(400, { error: 'event_name and event_time are required' });
    }

    if (parsedMultipart) {
      const file = parsedMultipart.file;
      if (!file || !file.buffer || file.buffer.length === 0) {
        return httpResponse(400, { error: 'route GPX file is required' });
      }
      const uploaded = await uploadRouteToS3(file);
      route = uploaded.url;
    } else {
      if (!route) {
        return httpResponse(400, { error: 'route is required' });
      }
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


