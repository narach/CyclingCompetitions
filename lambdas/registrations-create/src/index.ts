import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Pool } from 'pg';

const ssm = new SSMClient({});
let pool: Pool | undefined;

type RegistrationInput = {
  eventId: number;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  gender?: string;
  birth_year?: number;
  club?: string;
  country?: string;
  city?: string;
};

type Registration = {
  id: number;
  event_id: number;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  gender: string | null;
  birth_year: number | null;
  club: string | null;
  country: string | null;
  city: string | null;
  start_number: number | null;
  created_at: string;
  updated_at: string;
};

type RegistrationDTO = Omit<Registration, 'phone' | 'gender' | 'club' | 'country' | 'city'> & {
  phone: string;
  gender: string;
  club: string;
  country: string;
  city: string;
};

async function getParameter(name: string, withDecryption = true): Promise<string | undefined> {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: withDecryption });
  const resp = await ssm.send(cmd);
  return resp.Parameter?.Value;
}

async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const param = process.env.SSM_DB_URL_PARAM;
  if (!param) throw new Error('Missing SSM_DB_URL_PARAM');
  const url = await getParameter(param, true);
  if (!url) throw new Error('Database URL not found');
  const max = Number(process.env.DB_MAX_POOL || '2');
  pool = new Pool({ connectionString: url, max, idleTimeoutMillis: 5000 });
  return pool;
}

function badRequest(message: string) {
  return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: message }) };
}

function ok(body: unknown) {
  return { statusCode: 201, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

function parseBody(event: any): any {
  if (!event?.body) return {};
  try { return typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch { return {}; }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// Basic international phone: allows +, digits, spaces, dashes, and parentheses, 7-20 chars
const phoneRegex = /^[+]?[-()\s\d]{7,20}$/;

export const handler = async (event: any) => {
  try {
    const input = parseBody(event) as RegistrationInput;

    // Required fields
    if (!input || typeof input !== 'object') return badRequest('Invalid JSON');
    if (!Number.isInteger(input.eventId)) return badRequest('eventId is required and must be integer');
    if (!input.name?.trim()) return badRequest('name is required');
    if (!input.surname?.trim()) return badRequest('surname is required');
    if (!input.email?.trim()) return badRequest('email is required');

    // Email validation
    if (!emailRegex.test(input.email)) return badRequest('Invalid email');

    // Phone validation (if provided)
    if (input.phone && !phoneRegex.test(input.phone)) return badRequest('Invalid phone');

    // Birth year check (if provided)
    if (input.birth_year !== undefined) {
      if (!Number.isInteger(input.birth_year)) return badRequest('birth_year must be integer');
      const year = input.birth_year as number;
      const current = new Date().getFullYear();
      if (year < 1925 || year > current) return badRequest('birth_year must be between 1925 and current year');
    }

    const client = await (await getPool()).connect();
    try {
      const sql = `
        insert into event_registrations (
          event_id, name, surname, email, phone, gender, birth_year, club, country, city
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning id, event_id, name, surname, email, phone, gender, birth_year, club, country, city, start_number, created_at, updated_at
      `;
      const params = [
        input.eventId,
        input.name.trim(),
        input.surname.trim(),
        input.email.trim(),
        input.phone ?? null,
        input.gender ?? null,
        input.birth_year ?? null,
        input.club ?? null,
        input.country ?? null,
        input.city ?? null,
      ];
      const { rows } = await client.query<Registration>(sql, params);
      const r = rows[0];
      const normalized: RegistrationDTO = {
        ...r,
        phone: r.phone ?? '',
        gender: r.gender ?? '',
        club: r.club ?? '',
        country: r.country ?? '',
        city: r.city ?? '',
      };
      return ok({ registration: normalized });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};


