const AWS = require('aws-sdk');

exports.handler = async (event) => {
  const sns = new AWS.SNS();
  
  try {
    // Get S3 event details
    const s3Event = event.Records[0].s3;
    const objectKey = decodeURIComponent(s3Event.object.key.replace(/\+/g, ' '));
    
    // Alert if website files are uploaded to data folder
    if (objectKey.startsWith('data/') && 
        (objectKey.endsWith('.html') || objectKey.endsWith('.js') || objectKey.endsWith('.css'))) {
      
      await sns.publish({
        TopicArn: process.env.ALERT_TOPIC_ARN,
        Subject: 'S3 Security Alert: Website file in data folder',
        Message: `WARNING: Website file detected in data folder: ${objectKey}`
      }).promise();
    }
    
    // Alert if data files are uploaded to root
    if (!objectKey.startsWith('data/') && objectKey.endsWith('.json')) {
      await sns.publish({
        TopicArn: process.env.ALERT_TOPIC_ARN,
        Subject: 'S3 Organization Alert: Data file in wrong location',
        Message: `WARNING: Data file uploaded to root instead of data folder: ${objectKey}`
      }).promise();
    }
    
    return { statusCode: 200 };
    
  } catch (error) {
    console.error('Monitoring error:', error);
    return { statusCode: 500 };
  }
};