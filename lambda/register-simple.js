const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.USERS_TABLE;

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
    console.log('Raw event:', JSON.stringify(event));
    console.log('Event body type:', typeof event.body);
    console.log('Event body:', event.body);
    
    // Handle different body formats
    let requestBody;
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Request body is required' })
      };
    }
    
    if (typeof event.body === 'string') {
      console.log('Parsing string body');
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid JSON format' })
        };
      }
    } else {
      console.log('Using object body');
      requestBody = event.body;
    }
    
    console.log('Parsed requestBody:', requestBody);
    
    if (!requestBody) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Request body cannot be parsed' })
      };
    }
    
    const { email, password, name } = requestBody;
    
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email, password, and name are required' })
      };
    }
    
    // Check if user exists
    const existingUser = await dynamoDB.query({
      TableName: TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() }
    }).promise();
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }
    
    // Create user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      isActive: false
    };
    
    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: newUser
    }).promise();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully',
        user: { userId, email: newUser.email, name }
      })
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid request format' })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Registration failed', error: error.message })
    };
  }
};