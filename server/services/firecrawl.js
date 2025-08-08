// Firecrawl API service using REST API
// TODO: Sign up at https://firecrawl.dev and get your API key
// Add FIRECRAWL_API_KEY to your Railway environment variables

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v0'; // Official Firecrawl API endpoint

class FirecrawlService {
  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  FIRECRAWL_API_KEY not found in environment variables');
    }
  }

  /**
   * Crawl a website and extract content for analysis
   * @param {string} url - The website URL to crawl
   * @returns {Object} - Crawled content and metadata
   */
  async crawlWebsite(url) {
    try {
      console.log(`🕷️  Crawling: ${url}`);

      const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          pageOptions: {
            // Extract only the text content, no HTML tags
            onlyMainContent: true,
            includeHtml: false,
            // Wait for dynamic content to load
            waitFor: 2000,
            // Screenshot for future features (optional)
            screenshot: false
          },
          // Remove the problematic extractorOptions for now
          // We'll get basic content and let Claude do the analysis
          formats: ['markdown', 'html']
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid Firecrawl API key. Please check your FIRECRAWL_API_KEY environment variable.');
        }
        
        if (response.status === 429) {
          throw new Error('Firecrawl rate limit exceeded. Please try again later.');
        }
        
        if (response.status === 400) {
          throw new Error(`Invalid URL or crawl request: ${errorData.error || 'Bad request'}`);
        }

        throw new Error(`Firecrawl API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.success || !data.data) {
        throw new Error('Invalid response from Firecrawl API');
      }

      const crawlResult = data.data;
      
      // Extract and clean the content
      const content = this.extractContent(crawlResult);
      
      if (!content || content.length < 100) {
        throw new Error('Insufficient content extracted from website. The page might be empty or have access restrictions.');
      }

      console.log(`✅ Successfully crawled ${content.length} characters from ${url}`);

      return {
        url: url,
        content: content,
        metadata: {
          title: crawlResult.title || 'Unknown Title',
          description: crawlResult.description || '',
          statusCode: crawlResult.statusCode || 200,
          crawlTime: new Date().toISOString(),
          contentLength: content.length
        }
      };

    } catch (error) {
      console.error('❌ Firecrawl error:', error.message);
      
      // Re-throw with more context
      if (error.message.includes('fetch')) {
        throw new Error('Unable to connect to Firecrawl service. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Extract and clean content from Firecrawl response
   * @param {Object} crawlData - Raw crawl data from Firecrawl
   * @returns {string} - Cleaned content text
   */
  extractContent(crawlData) {
    let content = '';

    // Primary content sources (in order of preference)
    if (crawlData.markdown) {
      content = crawlData.markdown;
    } else if (crawlData.content) {
      content = crawlData.content;
    } else if (crawlData.text) {
      content = crawlData.text;
    } else if (crawlData.html) {
      // Fallback: strip HTML tags if only HTML is available
      content = crawlData.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Clean and normalize the content
    content = this.cleanContent(content);

    return content;
  }

  /**
   * Clean and normalize extracted content
   * @param {string} content - Raw content text
   * @returns {string} - Cleaned content
   */
  cleanContent(content) {
    if (!content) return '';

    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with AI analysis
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Trim whitespace
      .trim()
      // Limit content length to prevent API limits (Claude has ~200k token limit)
      .substring(0, 50000); // Roughly ~12k tokens, leaving room for our prompt
  }

  /**
   * Test the Firecrawl API connection
   * @returns {boolean} - True if API is accessible
   */
  async testConnection() {
    try {
      // Test with a simple, reliable website
      const testUrl = 'https://example.com';
      await this.crawlWebsite(testUrl);
      return true;
    } catch (error) {
      console.error('Firecrawl connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new FirecrawlService();