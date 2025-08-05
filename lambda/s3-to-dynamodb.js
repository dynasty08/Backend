const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('S3 to DynamoDB processor triggered:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            const size = record.s3.object.size;
            
            console.log(`Processing file: ${key} (${size} bytes)`);
            
            // Get file from S3
            const s3Object = await s3.getObject({
                Bucket: bucket,
                Key: key
            }).promise();
            
            const content = s3Object.Body.toString('utf-8');
            const preview = content.substring(0, 500);
            const lineCount = content.split('\n').length;
            
            // Store in DynamoDB
            const processedFile = {
                fileId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                fileName: key.split('/').pop(),
                fileSize: size,
                processedAt: new Date().toISOString(),
                contentPreview: preview,
                recordCount: lineCount,
                s3Bucket: bucket,
                s3Key: key,
                status: 'completed'
            };
            
            await dynamoDB.put({
                TableName: 'processed-files-table',
                Item: processedFile
            }).promise();
            
            console.log(`✅ Successfully processed and stored: ${key}`);
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