-- Create table for processed S3 data
-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS processed_files (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content_preview TEXT,
    record_count INTEGER,
    processing_status VARCHAR(50) DEFAULT 'completed',
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(500)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_processed_files_processed_at ON processed_files(processed_at);
CREATE INDEX IF NOT EXISTS idx_processed_files_status ON processed_files(processing_status);

-- Verify table creation
SELECT 'Table created successfully!' as status;
\d processed_files;