const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.USERS_TABLE;
const JWT_SECRET = 'your-secret-key';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    // Get token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'No token provided' })
      };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user as inactive
    await dynamoDB.update({
      TableName: TABLE_NAME,
      Key: { userId: decoded.userId },
      UpdateExpression: 'SET isActive = :inactive',
      ExpressionAttributeValues: {
        ':inactive': false
      }
    }).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Logout successful'
      })
    };
    
  } catch (error) {
    console.error('Logout error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Logout failed' })
    };
  }
};