const AWS = require('aws-sdk');
const { Pool } = require('pg');

const secretsManager = new AWS.SecretsManager();
let pool;

async function getDbCredentials() {
    const secret = await secretsManager.getSecretValue({
        SecretId: process.env.SECRET_ARN
    }).promise();
    return JSON.parse(secret.SecretString);
}

async function getDbPool() {
    if (!pool) {
        const credentials = await getDbCredentials();
        pool = new Pool({
            host: process.env.DB_HOST,
            user: credentials.username,
            password: credentials.password,
            database: process.env.DB_NAME,
            port: 5432,
            ssl: { rejectUnauthorized: false },
            max: 1
        });
    }
    return pool;
}

exports.handler = async (event) => {
    try {
        const dbPool = await getDbPool();
        
        // Check if table exists and get data
        const result = await dbPool.query(`
            SELECT * FROM processed_files 
            ORDER BY processed_at DESC 
            LIMIT 10;
        `);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: JSON.stringify({
                message: 'Processed files retrieved successfully',
                totalFiles: result.rows.length,
                files: result.rows
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};