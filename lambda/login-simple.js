const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.USERS_TABLE;
const JWT_SECRET = 'your-secret-key';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    const { email, password } = JSON.parse(event.body);
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }
    
    // Find user
    const result = await dynamoDB.query({
      TableName: TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() }
    }).promise();
    
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }
    
    const user = result.Items[0];
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }
    
    // Update last login time and set as active
    await dynamoDB.update({
      TableName: TABLE_NAME,
      Key: { userId: user.userId },
      UpdateExpression: 'SET lastLoginAt = :loginTime, isActive = :active',
      ExpressionAttributeValues: {
        ':loginTime': new Date().toISOString(),
        ':active': true
      }
    }).promise();
    
    // Generate token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: { userId: user.userId, email: user.email, name: user.name }
      })
    };
    
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Login failed' })
    };
  }
};