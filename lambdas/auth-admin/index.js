'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const jwt = require('jsonwebtoken');

const ssm = new SSMClient({});

async function getParameter(name, withDecryption = true) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: withDecryption });
  const resp = await ssm.send(cmd);
  return resp.Parameter?.Value;
}

function httpJson(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bodyObj),
  };
}

function parseBody(event) {
  if (!event?.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return {};
  }
}

exports.handler = async (event) => {
  try {
    const { username, password } = parseBody(event);
    if (!username || !password) {
      return httpJson(400, { error: 'username and password are required' });
    }

    const loginParam = process.env.SSM_ADMIN_LOGIN_PARAM;
    const passParam = process.env.SSM_ADMIN_PASSWORD_PARAM;
    if (!loginParam || !passParam) throw new Error('Missing SSM admin param names');

    const [expectedUser, expectedPass] = await Promise.all([
      getParameter(loginParam, false),
      getParameter(passParam, true),
    ]);

    if (username !== expectedUser || password !== expectedPass) {
      return httpJson(403, { error: 'Unauthorized' });
    }

    const credB64 = Buffer.from(`${username}:${password}`).toString('base64');
    const expiresInSeconds = 72 * 60 * 60; // 72 hours
    const secret = expectedPass; // use admin password as HMAC secret
    const token = jwt.sign({ sub: username, cred: credB64 }, secret, { algorithm: 'HS256', expiresIn: expiresInSeconds });

    return httpJson(200, { accessToken: token, expiresIn: expiresInSeconds });
  } catch (err) {
    console.error(err);
    return httpJson(500, { error: 'Internal Server Error' });
  }
};


