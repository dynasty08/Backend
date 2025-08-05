const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('🔍 VPC Debug - S3 event received');
    
    try {
        // Test 1: Basic S3 access
        console.log('📦 Testing S3 access...');
        const s3 = new AWS.S3();
        const bucket = event.Records[0].s3.bucket.name;
        const key = event.Records[0].s3.object.key;
        
        const s3Object = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();
        
        console.log('✅ S3 access successful');
        
        // Test 2: Secrets Manager access
        console.log('🔐 Testing Secrets Manager access...');
        const secretsManager = new AWS.SecretsManager();
        
        const secret = await secretsManager.getSecretValue({
            SecretId: process.env.SECRET_ARN
        }).promise();
        
        console.log('✅ Secrets Manager access successful');
        
        // Test 3: Parse credentials
        const credentials = JSON.parse(secret.SecretString);
        console.log('✅ Database credentials retrieved');
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'All VPC tests passed!',
                s3Size: s3Object.Body.length,
                dbHost: credentials.host || 'host found'
            })
        };
        
    } catch (error) {
        console.error('❌ VPC Debug Error:', error.message);
        console.error('❌ Error Code:', error.code);
        console.error('❌ Error Stack:', error.stack);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                code: error.code
            })
        };
    }
};