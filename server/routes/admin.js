const express = require('express');
const databaseService = require('../services/database');

const router = express.Router();

// Simple admin authentication
// TODO: Replace with proper auth system in production
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'growth-analyzer-admin-2024';

/**
 * Middleware to check admin authentication
 */
const requireAdmin = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Admin access required. Add ?token=YOUR_TOKEN to the URL.'
    });
  }
  
  next();
};

/**
 * GET /api/admin/leads - View lead statistics and recent submissions
 */
router.get('/leads', requireAdmin, async (req, res) => {
  try {
    console.log('📊 Admin accessing lead dashboard');
    
    const stats = await databaseService.getLeadStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        overview: {
          totalSubmissions: parseInt(stats.overview.total_submissions) || 0,
          uniqueDomains: parseInt(stats.overview.unique_domains) || 0,
          averageScore: parseFloat(stats.overview.avg_score) || 0,
          excellentScores: parseInt(stats.overview.excellent_scores) || 0,
          goodScores: parseInt(stats.overview.good_scores) || 0,
          poorScores: parseInt(stats.overview.poor_scores) || 0,
          last24Hours: parseInt(stats.overview.last_24h) || 0,
          last7Days: parseInt(stats.overview.last_7d) || 0
        },
        recentSubmissions: stats.recentSubmissions.map(submission => ({
          domain: submission.domain,
          score: submission.growth_score,
          title: submission.title,
          analyzedAt: submission.created_at,
          scoreCategory: submission.growth_score >= 80 ? 'Excellent' :
                       submission.growth_score >= 65 ? 'Good' :
                       submission.growth_score >= 45 ? 'Fair' : 'Poor'
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    res.status(500).json({
      error: 'Dashboard error',
      message: 'Unable to fetch lead data'
    });
  }
});

/**
 * GET /api/admin/leads/export - Export leads as CSV
 */
router.get('/leads/export', requireAdmin, async (req, res) => {
  try {
    console.log('📄 Admin exporting leads as CSV');
    
    // Get all submissions for export
    const exportQuery = `
      SELECT 
        domain,
        url,
        growth_score,
        title,
        analysis_summary,
        ip_address,
        created_at,
        analyzed_at
      FROM website_submissions 
      ORDER BY created_at DESC
    `;
    
    const result = await databaseService.pool.query(exportQuery);
    const submissions = result.rows;
    
    // Generate CSV
    const csvHeader = 'Domain,URL,Score,Title,Summary,IP,Submitted,Analyzed\n';
    const csvRows = submissions.map(row => {
      return [
        row.domain,
        row.url,
        row.growth_score,
        `"${row.title?.replace(/"/g, '""') || ''}"`,
        `"${row.analysis_summary?.substring(0, 100)?.replace(/"/g, '""') || ''}"`,
        row.ip_address,
        row.created_at?.toISOString(),
        row.analyzed_at?.toISOString()
      ].join(',');
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="growth-analyzer-leads-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'Unable to export lead data'
    });
  }
});

/**
 * GET /api/admin/health - Check database connection
 */
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const dbConnected = await databaseService.testConnection();
    
    res.json({
      success: true,
      database: dbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;