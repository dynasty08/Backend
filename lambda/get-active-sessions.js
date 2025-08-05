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
    // Get current time
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Scan for users who logged in within last 24 hours
    const result = await dynamoDB.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'lastLoginAt > :timeThreshold AND isActive = :active',
      ExpressionAttributeValues: {
        ':timeThreshold': twentyFourHoursAgo.toISOString(),
        ':active': true
      }
    }).promise();
    
    const activeSessions = result.Items || [];
    
    // Calculate session details
    const sessionStats = {
      totalActiveSessions: activeSessions.length,
      sessionsLast1Hour: 0,
      sessionsLast6Hours: 0,
      sessionsLast24Hours: activeSessions.length
    };
    
    // Count sessions by time periods
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    
    activeSessions.forEach(user => {
      const loginTime = new Date(user.lastLoginAt);
      if (loginTime > oneHourAgo) {
        sessionStats.sessionsLast1Hour++;
      }
      if (loginTime > sixHoursAgo) {
        sessionStats.sessionsLast6Hours++;
      }
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        activeSessions: sessionStats.totalActiveSessions,
        sessionBreakdown: sessionStats,
        activeUsers: activeSessions.map(user => ({
          userId: user.userId,
          name: user.name,
          email: user.email,
          lastLoginAt: user.lastLoginAt
        }))
      })
    };
    
  } catch (error) {
    console.error('Active sessions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: 'Failed to get active sessions',
        activeSessions: 0
      })
    };
  }
};