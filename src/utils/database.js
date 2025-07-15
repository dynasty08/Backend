const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Pool } = require('pg');

let pool;

async function getDbCredentials() {
  const client = new SecretsManagerClient({ region: 'ap-southeast-1' });
  const command = new GetSecretValueCommand({ SecretId: process.env.SECRET_ARN });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

async function getDbPool() {
  if (!pool) {
    const credentials = await getDbCredentials();
    pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: credentials.username,
      password: credentials.password,
      port: 5432,
    });
  }
  return pool;
}

module.exports = { getDbPool };
