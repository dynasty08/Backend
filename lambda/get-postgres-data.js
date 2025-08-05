const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Pool } = require('pg');

let pool;

async function getDbCredentials() {
  const client = new SecretsManagerClient({ region: 'ap-southeast-1' });
  const command = new GetSecretValueCommand({ SecretId: process.env.SECRET_ARN });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

async function getDbPool() {
  if (!pool) {
    const credentials = await getDbCredentials();
    pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: credentials.username,
      password: credentials.password,
      port: 5432,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

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
    const dbPool = await getDbPool();
    
    // Get database information
    const dbInfoQuery = `
      SELECT 
        current_database() as database_name,
        version() as version,
        current_user as current_user
    `;
    const dbInfo = await dbPool.query(dbInfoQuery);
    
    // Get table information
    const tablesQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tablesResult = await dbPool.query(tablesQuery);
    
    // Get sample data from each table
    const tableData = {};
    for (const table of tablesResult.rows) {
      try {
        // Get column information
        const columnsQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        const columnsResult = await dbPool.query(columnsQuery, [table.table_name]);
        
        // Get row count
        const countQuery = `SELECT COUNT(*) as count FROM "${table.table_name}"`;
        const countResult = await dbPool.query(countQuery);
        
        // Get sample data (first 5 rows)
        const sampleQuery = `SELECT * FROM "${table.table_name}" LIMIT 5`;
        const sampleResult = await dbPool.query(sampleQuery);
        
        tableData[table.table_name] = {
          type: table.table_type,
          totalRows: parseInt(countResult.rows[0].count),
          columns: columnsResult.rows,
          sampleData: sampleResult.rows,
          columnNames: columnsResult.rows.map(col => col.column_name)
        };
      } catch (tableError) {
        console.error(`Error querying table ${table.table_name}:`, tableError);
        tableData[table.table_name] = {
          type: table.table_type,
          error: 'Unable to query table data'
        };
      }
    }
    
    // Calculate total rows across all tables
    const totalRows = Object.values(tableData).reduce((sum, table) => {
      return sum + (table.totalRows || 0);
    }, 0);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database information retrieved successfully',
        database: {
          name: dbInfo.rows[0].database_name,
          host: process.env.DB_HOST,
          version: dbInfo.rows[0].version,
          user: dbInfo.rows[0].current_user
        },
        statistics: {
          totalTables: tablesResult.rows.length,
          totalRows: totalRows
        },
        tables: tablesResult.rows.map(t => t.table_name),
        tableData: tableData
      })
    };
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Database connection failed',
        error: error.message,
        fallbackMessage: 'Using mock data while database connection is being fixed'
      })
    };
  }
};