const express = require('express');
const firecrawlService = require('../services/firecrawl');
const anthropicService = require('../services/anthropic');

const router = express.Router();

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Main analysis endpoint
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;

    // Input validation
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a website URL to analyze'
      });
    }

    if (!URL_REGEX.test(url)) {
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Please provide a valid website URL (including http:// or https://)'
      });
    }

    console.log(`📊 Starting analysis for: ${url}`);

    // Step 1: Crawl website with Firecrawl
    console.log('🕷️  Crawling website...');
    const crawlData = await firecrawlService.crawlWebsite(url);
    
    if (!crawlData || !crawlData.content) {
      return res.status(400).json({
        error: 'Unable to crawl website',
        message: 'The website could not be accessed or analyzed. Please check the URL and try again.'
      });
    }

    console.log(`✅ Successfully crawled ${crawlData.content.length} characters`);

    // Step 2: Analyze with Claude AI
    console.log('🤖 Analyzing with AI...');
    const analysisResult = await anthropicService.analyzeWebsiteGrowth(crawlData);

    if (!analysisResult) {
      return res.status(500).json({
        error: 'Analysis failed',
        message: 'Unable to complete the growth analysis. Please try again.'
      });
    }

    console.log(`✅ Analysis complete - Score: ${analysisResult.score}/100`);

    // Step 3: Return structured response
    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      analysis: {
        score: analysisResult.score,
        feedback: analysisResult.feedback,
        categories: analysisResult.categories || [],
        recommendations: analysisResult.recommendations || []
      },
      metadata: {
        contentLength: crawlData.content.length,
        analysisTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);

    // Handle specific error types
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment before trying again.'
      });
    }

    if (error.message.includes('API key')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Service temporarily unavailable. Please try again later.'
      });
    }

    if (error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The analysis took too long. Please try with a smaller website or try again later.'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Unable to complete the website analysis. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
});

// Test endpoint for development
router.get('/test', (req, res) => {
  res.json({
    message: 'Analysis API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;