const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    // Railway automatically provides DATABASE_URL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection pool settings for Railway
      max: 10, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    this.initializeDatabase();
  }

  /**
   * Initialize database tables if they don't exist
   */
  async initializeDatabase() {
    try {
      console.log('🗃️  Initializing database...');
      
      // Fixed SQL with proper PostgreSQL syntax
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS website_submissions (
          id SERIAL PRIMARY KEY,
          url VARCHAR(500) NOT NULL,
          domain VARCHAR(255),
          
          -- Analysis results
          growth_score INTEGER,
          analysis_summary TEXT,
          analysis_categories JSONB,
          recommendations JSONB,
          
          -- Website metadata
          content_length INTEGER,
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          analyzed_at TIMESTAMP
        );

        -- Create unique index to prevent spam (one analysis per URL per day)
        -- Using a functional index instead of inline constraint
        CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_url_date 
        ON website_submissions(url, DATE(created_at));

        -- Create other indexes for performance
        CREATE INDEX IF NOT EXISTS idx_submissions_domain ON website_submissions(domain);
        CREATE INDEX IF NOT EXISTS idx_submissions_score ON website_submissions(growth_score);
        CREATE INDEX IF NOT EXISTS idx_submissions_created ON website_submissions(created_at);
        CREATE INDEX IF NOT EXISTS idx_submissions_url ON website_submissions(url);
        CREATE INDEX IF NOT EXISTS idx_submissions_analyzed ON website_submissions(analyzed_at);
      `;

      await this.pool.query(createTableQuery);
      console.log('✅ Database tables initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      // Don't crash the app if database fails - log the specific error
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        position: error.position,
        hint: error.hint
      });
    }
  }

  /**
   * Save website submission as a potential lead
   * @param {Object} submissionData - Complete submission data
   * @returns {Object} - Saved record info
   */
  async saveWebsiteSubmission(submissionData) {
    try {
      // Extract domain from URL for easier lead management
      const domain = this.extractDomain(submissionData.url);
      
      // First, try to insert the record
      const insertQuery = `
        INSERT INTO website_submissions 
        (url, domain, growth_score, analysis_summary, analysis_categories, 
         recommendations, content_length, analyzed_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at, domain
      `;
      
      const currentTime = new Date();
      const values = [
        submissionData.url,
        domain,
        submissionData.analysis.score,
        submissionData.analysis.summary || submissionData.analysis.feedback,
        JSON.stringify(submissionData.analysis.categories || []),
        JSON.stringify(submissionData.analysis.recommendations || []),
        submissionData.metadata?.contentLength || 0,
        currentTime,
        currentTime
      ];

      try {
        const result = await this.pool.query(insertQuery, values);
        const savedRecord = result.rows[0];
        
        console.log(`💾 Saved lead: ${domain} (ID: ${savedRecord.id})`);
        return savedRecord;
        
      } catch (insertError) {
        // If it's a unique constraint violation (duplicate URL same day), update instead
        if (insertError.code === '23505') { // Unique violation
          console.log(`🔄 URL already analyzed today, updating: ${domain}`);
          
          const updateQuery = `
            UPDATE website_submissions 
            SET 
              growth_score = $2,
              analysis_summary = $3,
              analysis_categories = $4,
              recommendations = $5,
              content_length = $6,
              analyzed_at = $7
            WHERE url = $1 
              AND DATE(created_at) = CURRENT_DATE
            RETURNING id, created_at, domain
          `;
          
          const updateValues = [
            submissionData.url,
            submissionData.analysis.score,
            submissionData.analysis.summary || submissionData.analysis.feedback,
            JSON.stringify(submissionData.analysis.categories || []),
            JSON.stringify(submissionData.analysis.recommendations || []),
            submissionData.metadata?.contentLength || 0,
            currentTime
          ];
          
          const updateResult = await this.pool.query(updateQuery, updateValues);
          const updatedRecord = updateResult.rows[0];
          
          console.log(`💾 Updated lead: ${domain} (ID: ${updatedRecord.id})`);
          return updatedRecord;
        } else {
          // Re-throw if it's not a unique constraint violation
          throw insertError;
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to save submission:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        constraint: error.constraint
      });
      // Don't crash analysis if database save fails
      return null;
    }
  }

  /**
   * Get lead statistics for business intelligence
   * @returns {Object} - Lead statistics
   */
  async getLeadStats() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(DISTINCT domain) as unique_domains,
          ROUND(AVG(growth_score), 1) as avg_score,
          COUNT(CASE WHEN growth_score >= 80 THEN 1 END) as excellent_scores,
          COUNT(CASE WHEN growth_score >= 65 THEN 1 END) as good_scores,
          COUNT(CASE WHEN growth_score < 45 THEN 1 END) as poor_scores,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
        FROM website_submissions
      `;
      
      const recentDomainsQuery = `
        SELECT domain, growth_score, created_at
        FROM website_submissions 
        ORDER BY created_at DESC 
        LIMIT 10
      `;

      const [stats, recentDomains] = await Promise.all([
        this.pool.query(statsQuery),
        this.pool.query(recentDomainsQuery)
      ]);

      return {
        overview: stats.rows[0],
        recentSubmissions: recentDomains.rows
      };
      
    } catch (error) {
      console.error('❌ Failed to get lead stats:', error);
      return { overview: {}, recentSubmissions: [] };
    }
  }

  /**
   * Extract clean domain from URL
   * @param {string} url - Full URL
   * @returns {string} - Clean domain
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      // Fallback for malformed URLs
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  /**
   * Test database connection
   * @returns {boolean} - Connection success
   */
  async testConnection() {
    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✅ Database connection successful');
      console.log('📊 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.error('Connection details:', {
        message: error.message,
        code: error.code,
        host: error.hostname || 'unknown'
      });
      return false;
    }
  }

  /**
   * Get database info (useful for debugging)
   * @returns {Object} - Database information
   */
  async getDatabaseInfo() {
    try {
      const queries = [
        "SELECT current_database() as database_name",
        "SELECT current_user as current_user",
        "SELECT version() as version"
      ];
      
      const results = await Promise.all(
        queries.map(query => this.pool.query(query))
      );
      
      return {
        database: results[0].rows[0].database_name,
        user: results[1].rows[0].current_user,
        version: results[2].rows[0].version.split(' ')[0]
      };
    } catch (error) {
      console.error('❌ Failed to get database info:', error);
      return { error: error.message };
    }
  }

  /**
   * Gracefully close database connections
   */
  async close() {
    try {
      await this.pool.end();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
    }
  }
}

module.exports = new DatabaseService();