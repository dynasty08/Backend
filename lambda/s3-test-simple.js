const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('S3 Test triggered:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            const size = record.s3.object.size;
            
            console.log(`Processing file: ${key} (${size} bytes)`);
            
            // Get file from S3 (no VPC needed)
            const s3Object = await s3.getObject({
                Bucket: bucket,
                Key: key
            }).promise();
            
            const content = s3Object.Body.toString('utf-8');
            console.log(`File content preview: ${content.substring(0, 100)}...`);
            
            console.log(`✅ Successfully processed: ${key}`);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully processed ${event.Records.length} files`
            })
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
};