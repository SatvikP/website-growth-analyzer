// Anthropic Claude AI service for website growth analysis
// TODO: Sign up at https://console.anthropic.com and get your API key
// Add ANTHROPIC_API_KEY to your Railway environment variables

const Anthropic = require('@anthropic-ai/sdk');

class AnthropicService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not found in environment variables');
      return;
    }

    this.anthropic = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  /**
   * Analyze website content for growth potential using Claude AI
   * @param {Object} crawlData - Content and metadata from Firecrawl
   * @returns {Object} - Analysis results with score and feedback
   */
  async analyzeWebsiteGrowth(crawlData) {
    try {
      console.log('🤖 Starting AI analysis...');

      if (!this.anthropic) {
        throw new Error('Anthropic API key not configured');
      }

      const growthAnalysisPrompt = this.buildGrowthPrompt(crawlData);

      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514", // TODO: Update to latest model if needed
        max_tokens: 4000,
        temperature: 0.3, // Lower temperature for more consistent scoring
        messages: [
          {
            role: "user",
            content: growthAnalysisPrompt
          }
        ]
      });

      const response = message.content[0].text;
      
      // Parse the structured response from Claude
      const analysisResult = this.parseAnalysisResponse(response);
      
      console.log(`✅ AI analysis complete - Score: ${analysisResult.score}/100`);
      
      return analysisResult;

    } catch (error) {
      console.error('❌ Anthropic AI error:', error.message);
      
      if (error.message.includes('rate_limit')) {
        throw new Error('Claude API rate limit exceeded. Please try again in a few minutes.');
      }
      
      if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
        throw new Error('Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY environment variable.');
      }
      
      if (error.message.includes('overloaded')) {
        throw new Error('Claude AI service is temporarily overloaded. Please try again in a moment.');
      }
      
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Build the growth analysis prompt for Claude
   * @param {Object} crawlData - Website content and metadata
   * @returns {string} - Formatted prompt for Claude
   */
  buildGrowthPrompt(crawlData) {
    return `You are a senior growth consultant and conversion optimization expert with 15+ years of experience helping websites achieve exponential growth. You specialize in analyzing websites through the lens of proven growth frameworks including AARRR (Acquisition, Activation, Retention, Referral, Revenue), conversion funnel optimization, and user experience psychology.

WEBSITE TO ANALYZE:
URL: ${crawlData.url}
Title: ${crawlData.metadata.title}
Description: ${crawlData.metadata.description || 'No description available'}

WEBSITE CONTENT:
${crawlData.content}

ANALYSIS FRAMEWORK:
Please analyze this website across these critical growth dimensions:

1. **FIRST IMPRESSION & VALUE PROPOSITION** (20 points)
   - Clear value proposition within 5 seconds
   - Professional design and trustworthiness
   - Mobile responsiveness indicators
   - Loading speed perception

2. **CONVERSION OPTIMIZATION** (25 points)
   - Clear call-to-action buttons
   - Friction reduction in user journey
   - Forms and signup process simplicity
   - Social proof and testimonials

3. **CONTENT & MESSAGING** (20 points)
   - Benefit-focused copy vs feature-focused
   - Clear target audience messaging
   - Content quality and engagement
   - SEO-friendly content structure

4. **GROWTH MECHANICS** (20 points)
   - Lead magnets and email capture
   - Referral or sharing mechanisms
   - Viral or network effects potential
   - Retention and engagement features

5. **TECHNICAL FOUNDATION** (15 points)
   - Basic SEO elements (titles, meta descriptions)
   - Contact information and trust signals
   - Navigation clarity
   - Accessibility basics

REQUIRED OUTPUT FORMAT:
Please respond with EXACTLY this JSON structure (no additional text before or after):

{
  "score": [number between 0-100],
  "summary": "[2-3 sentence overall assessment]",
  "categories": [
    {
      "name": "First Impression & Value Proposition",
      "score": [0-20],
      "feedback": "[specific feedback]"
    },
    {
      "name": "Conversion Optimization", 
      "score": [0-25],
      "feedback": "[specific feedback]"
    },
    {
      "name": "Content & Messaging",
      "score": [0-20], 
      "feedback": "[specific feedback]"
    },
    {
      "name": "Growth Mechanics",
      "score": [0-20],
      "feedback": "[specific feedback]"
    },
    {
      "name": "Technical Foundation",
      "score": [0-15],
      "feedback": "[specific feedback]"
    }
  ],
  "recommendations": [
    {
      "priority": "High|Medium|Low",
      "action": "[specific actionable recommendation]",
      "impact": "[expected impact on growth]",
      "effort": "Low|Medium|High"
    }
  ]
}

ANALYSIS GUIDELINES:
- Be honest and direct in your scoring - most websites have significant room for improvement
- Focus on actionable insights, not generic advice
- Consider both B2B and B2C growth principles
- Prioritize recommendations by potential impact vs implementation effort
- Score conservatively - an 80+ score should represent truly exceptional growth optimization
- Provide specific examples from the website content when possible
- If critical information is missing (like contact info), factor that into scoring

Analyze this website now:`;
  }

  /**
   * Parse Claude's response into structured analysis results
   * @param {string} response - Raw response from Claude
   * @returns {Object} - Parsed analysis results
   */
  parseAnalysisResponse(response) {
    try {
      // Clean the response to extract JSON
      let cleanResponse = response.trim();
      
      // Remove any markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object in the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Claude response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsedResult.score || !parsedResult.categories || !parsedResult.recommendations) {
        throw new Error('Invalid response structure from Claude');
      }

      // Ensure score is within valid range
      parsedResult.score = Math.min(100, Math.max(0, parsedResult.score));

      // Add fallback values for optional fields
      parsedResult.summary = parsedResult.summary || 'Analysis completed successfully.';
      parsedResult.feedback = parsedResult.summary; // Backward compatibility

      return parsedResult;

    } catch (error) {
      console.error('❌ Failed to parse Claude response:', error.message);
      console.log('Raw response:', response);
      
      // Return fallback analysis result
      return {
        score: 50,
        summary: 'Analysis completed but response parsing failed. Please try again.',
        feedback: 'The website analysis encountered a technical issue. The website appears to have basic functionality but we recommend running the analysis again for detailed insights.',
        categories: [
          {
            name: 'Analysis Error',
            score: 50,
            feedback: 'Technical issue prevented detailed analysis. Please try again.'
          }
        ],
        recommendations: [
          {
            priority: 'High',
            action: 'Re-run the analysis for detailed insights',
            impact: 'Get specific recommendations for growth optimization',
            effort: 'Low'
          }
        ]
      };
    }
  }

  /**
   * Test the Anthropic API connection
   * @returns {boolean} - True if API is accessible
   */
  async testConnection() {
    try {
      if (!this.anthropic) {
        return false;
      }

      await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ]
      });
      
      return true;
    } catch (error) {
      console.error('Anthropic connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new AnthropicService();