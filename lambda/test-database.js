exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // Return mock database information for testing
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database test endpoint working',
        database: {
          name: 'serverlessdatabase',
          host: 'serverlessdatabase.cv646auk2i3w.ap-southeast-1.rds.amazonaws.com',
          version: 'PostgreSQL 13.x',
          user: 'postgres'
        },
        statistics: {
          totalTables: 3,
          totalRows: 150
        },
        tables: ['users', 'products', 'orders'],
        tableData: {
          users: {
            type: 'BASE TABLE',
            totalRows: 50,
            columns: [
              { column_name: 'id', data_type: 'integer' },
              { column_name: 'username', data_type: 'varchar' },
              { column_name: 'email', data_type: 'varchar' }
            ],
            sampleData: [
              { id: 1, username: 'sampledata1', email: 'sample1@example.com' },
              { id: 2, username: 'sampledata2', email: 'sample2@example.com' }
            ],
            columnNames: ['id', 'username', 'email']
          },
          products: {
            type: 'BASE TABLE',
            totalRows: 75,
            columns: [
              { column_name: 'id', data_type: 'integer' },
              { column_name: 'name', data_type: 'varchar' },
              { column_name: 'price', data_type: 'decimal' }
            ],
            sampleData: [
              { id: 1, name: 'Laptop', price: 999.99 },
              { id: 2, name: 'Mouse', price: 29.99 }
            ],
            columnNames: ['id', 'name', 'price']
          }
        }
      })
    };
    
  } catch (error) {
    console.error('Test database error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: 'Test database endpoint error',
        error: error.message
      })
    };
  }
};