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
          title VARCHAR(500),
          description TEXT,
          content_length INTEGER,
          
          -- Lead tracking data
          ip_address INET,
          user_agent TEXT,
          referrer VARCHAR(500),
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          analyzed_at TIMESTAMP,
          
          -- Prevent spam: one analysis per URL per day
          UNIQUE(url, DATE(created_at))
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_submissions_domain ON website_submissions(domain);
        CREATE INDEX IF NOT EXISTS idx_submissions_score ON website_submissions(growth_score);
        CREATE INDEX IF NOT EXISTS idx_submissions_created ON website_submissions(created_at);
        CREATE INDEX IF NOT EXISTS idx_submissions_url ON website_submissions(url);
      `;

      await this.pool.query(createTableQuery);
      console.log('✅ Database tables initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      // Don't crash the app if database fails
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
      
      const query = `
        INSERT INTO website_submissions 
        (url, domain, growth_score, analysis_summary, analysis_categories, 
         recommendations, title, description, content_length, ip_address, 
         user_agent, referrer, analyzed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (url, DATE(CURRENT_TIMESTAMP))
        DO UPDATE SET
          growth_score = EXCLUDED.growth_score,
          analysis_summary = EXCLUDED.analysis_summary,
          analysis_categories = EXCLUDED.analysis_categories,
          recommendations = EXCLUDED.recommendations,
          analyzed_at = EXCLUDED.analyzed_at
        RETURNING id, created_at, domain
      `;
      
      const values = [
        submissionData.url,
        domain,
        submissionData.analysis.score,
        submissionData.analysis.summary || submissionData.analysis.feedback,
        JSON.stringify(submissionData.analysis.categories || []),
        JSON.stringify(submissionData.analysis.recommendations || []),
        submissionData.metadata?.title || 'Unknown Title',
        submissionData.metadata?.description || '',
        submissionData.metadata?.contentLength || 0,
        submissionData.ip,
        submissionData.userAgent,
        submissionData.referrer,
        new Date()
      ];

      const result = await this.pool.query(query, values);
      const savedRecord = result.rows[0];
      
      console.log(`💾 Saved lead: ${domain} (ID: ${savedRecord.id})`);
      return savedRecord;
      
    } catch (error) {
      console.error('❌ Failed to save submission:', error);
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
        SELECT domain, growth_score, title, created_at
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
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Gracefully close database connections
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = new DatabaseService();