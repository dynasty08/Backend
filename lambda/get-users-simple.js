const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.USERS_TABLE;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    const result = await dynamoDB.scan({
      TableName: TABLE_NAME,
      ProjectionExpression: 'userId, email, #name, createdAt',
      ExpressionAttributeNames: { '#name': 'name' }
    }).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Users retrieved successfully',
        users: result.Items || [],
        count: result.Count || 0
      })
    };
    
  } catch (error) {
    console.error('Get users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to get users' })
    };
  }
};