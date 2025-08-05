const AWS = require('aws-sdk');
const { Pool } = require('pg');

const s3 = new AWS.S3();
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
    console.log('S3 Processor triggered:', JSON.stringify(event, null, 2));
    
    try {
        const dbPool = await getDbPool();
        
        // Create table if not exists
        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS processed_files (
                id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                content_preview TEXT,
                record_count INTEGER,
                s3_bucket VARCHAR(100),
                s3_key VARCHAR(500)
            );
        `);
        
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            const size = record.s3.object.size;
            
            // Get file from S3 via VPC endpoint
            const s3Object = await s3.getObject({
                Bucket: bucket,
                Key: key
            }).promise();
            
            const content = s3Object.Body.toString('utf-8');
            const preview = content.substring(0, 500);
            const lineCount = content.split('\n').length;
            
            // Store in PostgreSQL
            await dbPool.query(`
                INSERT INTO processed_files 
                (file_name, file_size, content_preview, record_count, s3_bucket, s3_key)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                key.split('/').pop(),
                size,
                preview,
                lineCount,
                bucket,
                key
            ]);
            
            console.log(`Processed: ${key}`);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${event.Records.length} files`
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};