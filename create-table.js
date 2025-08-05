const { Pool } = require('pg');

const pool = new Pool({
    host: 'serverlessdatabase.cv646auk2i3w.ap-southeast-1.rds.amazonaws.com',
    user: 'postgres',
    password: 'your_password_here', // Replace with your actual password
    database: 'serverlessdatabase',
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
        require: true
    }
});

async function createTable() {
    try {
        const result = await pool.query(`
            CREATE TABLE IF NOT EXISTS processed_files (
                id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                content_preview TEXT,
                record_count INTEGER,
                s3_bucket VARCHAR(100),
                s3_key VARCHAR(500)
            );
        `);
        
        console.log('✅ Table created successfully!');
        
        // Verify table exists
        const verify = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'processed_files';
        `);
        
        console.log('📋 Table columns:', verify.rows);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

createTable();