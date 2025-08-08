# AI-Powered Website Growth Analyzer 🚀

Get instant, professional feedback on your website's growth potential powered by Claude AI and automated website crawling.

![Website Growth Analyzer](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge) ![Railway](https://img.shields.io/badge/Deploy-Railway-purple?style=for-the-badge) ![React](https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge) ![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge)

## ✨ Features

- 🤖 **Claude AI Analysis** - Powered by Anthropic's Claude 3.5 Sonnet
- 🕷️ **Automated Website Crawling** - Uses Firecrawl API to extract website content
- 📊 **Growth Scoring** - Comprehensive 0-100 score across 5 key growth dimensions
- 🎯 **Actionable Recommendations** - Prioritized suggestions with effort/impact ratings
- ⚡ **Fast Results** - Complete analysis in 60 seconds
- 📱 **Mobile Responsive** - Beautiful UI with orange gradient design
- 🔒 **Secure** - API keys stored in environment variables

## 🏗️ Architecture

**Full-Stack Application:**
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude API
- **Web Crawling**: Firecrawl API
- **Deployment**: Railway (full-stack deployment)

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/...)

### 1. One-Click Deploy (Recommended)

1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Fork this repository
4. Add your API keys (see step 3 below)
5. Your app will be live!

### 2. Manual Deployment

**Step 1: Fork & Clone**
```bash
git clone https://github.com/YOUR_USERNAME/website-growth-analyzer.git
cd website-growth-analyzer
```

**Step 2: Get API Keys**

**Firecrawl API Key:**
1. Visit [firecrawl.dev](https://firecrawl.dev)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key (starts with `fc-`)

**Anthropic API Key:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up for an account
3. Go to API Keys section
4. Create a new API key (starts with `sk-ant-`)

**Step 3: Deploy to Railway**

1. **Connect to Railway:**
   - Visit [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your forked repository

2. **Add Environment Variables:**
   In Railway dashboard → Project Settings → Variables tab:
   ```
   FIRECRAWL_API_KEY=fc-your-actual-firecrawl-key-here
   ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
   NODE_ENV=production
   ```

3. **Configure Networking:**
   - Go to "Networking" tab
   - Click "Generate Domain"
   - **IMPORTANT**: Set custom port to `8080` (not 3000)
   - Your app will be live at `yourapp.railway.app`

## 💻 Local Development

**Prerequisites:**
- Node.js 18+ 
- npm or yarn
- Firecrawl API key
- Anthropic API key

**Setup:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/website-growth-analyzer.git
   cd website-growth-analyzer
   ```

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual API keys:
   ```
   FIRECRAWL_API_KEY=fc-your-actual-key
   ANTHROPIC_API_KEY=sk-ant-your-actual-key
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```

4. **Start development servers:**
   
   **Terminal 1 (Backend):**
   ```bash
   npm run dev
   ```
   
   **Terminal 2 (Frontend):**
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/analyze` | POST | Analyze website growth potential |
| `/api/analyze/test` | GET | Test endpoint for development |

**Example Analysis Request:**
```bash
curl -X POST https://yourapp.railway.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 📊 Growth Analysis Framework

The AI analyzes websites across 5 key dimensions:

1. **First Impression & Value Proposition** (20 points)
   - Clear value proposition
   - Professional design
   - Mobile responsiveness
   - Loading speed perception

2. **Conversion Optimization** (25 points) 
   - Call-to-action effectiveness
   - Friction reduction
   - Form optimization
   - Social proof

3. **Content & Messaging** (20 points)
   - Benefit-focused copy
   - Target audience clarity
   - Content engagement
   - SEO optimization

4. **Growth Mechanics** (20 points)
   - Lead generation
   - Viral/referral potential
   - Retention features
   - Network effects

5. **Technical Foundation** (15 points)
   - SEO basics
   - Trust signals
   - Navigation clarity
   - Accessibility

**Total Score: 0-100 points with actionable recommendations**

## 🎨 Customization

**Design:**
- Color scheme: Orange gradient theme in `client/src/index.css`
- Typography: Futura Italic fonts
- Components: Located in `client/src/App.jsx`

**AI Analysis:**
- Prompts: Customize in `server/services/anthropic.js`
- Temperature: Adjust creativity vs consistency (currently 0.3)
- Max tokens: Control response length (currently 4000)

**Scoring Framework:**
- Categories: Modify in `buildGrowthPrompt()` function
- Point allocation: Adjust category weights
- Recommendations: Customize priority/effort calculations

## 📁 Project Structure

```
website-growth-analyzer/
├── README.md                    # This file
├── .gitignore                   # Security: prevents API keys in git
├── .env.example                 # Environment variables template
├── package.json                 # Root build scripts
│
├── client/                      # Frontend React application
│   ├── package.json            # Client dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── index.html              # HTML entry point
│   └── src/
│       ├── App.jsx             # Main React component
│       ├── main.jsx            # React entry point
│       └── index.css           # Styling
│
└── server/                      # Backend Node.js application
    ├── package.json            # Server dependencies
    ├── server.js               # Main server file
    ├── routes/
    │   └── analyze.js          # Analysis API endpoint
    └── services/
        ├── firecrawl.js        # Website crawling service
        └── anthropic.js        # AI analysis service
```

## 💰 Cost Estimation

**Firecrawl API:**
- ~$0.01-0.02 per website crawl
- 1000 analyses ≈ $10-20

**Anthropic Claude API:**
- ~$0.05-0.08 per analysis
- 1000 analyses ≈ $50-80

**Railway Hosting:**
- Free tier: $0/month (with limitations)
- Pro tier: $5/month + usage

**Total for 1000 analyses: ~$65-108**

## 🔒 Security Features

- ✅ API keys stored in environment variables
- ✅ CORS protection
- ✅ Rate limiting (10 requests per 15 minutes)
- ✅ Input validation and sanitization  
- ✅ Helmet security headers
- ✅ No sensitive data in repository

## 🚨 Troubleshooting

**Common Issues:**

1. **"Cannot find module 'express'" error:**
   - Solution: Ensure dependencies are installed in both client and server directories

2. **"Application failed to respond" on Railway:**
   - Check: Custom port set to 8080 (not 3000)
   - Verify: Environment variables are set correctly

3. **"Invalid URL or crawl request" errors:**
   - Check: Firecrawl API key is valid and has credits
   - Verify: Website URL is accessible and properly formatted

4. **"AI analysis failed" errors:**
   - Check: Anthropic API key is valid and has credits
   - Verify: API rate limits not exceeded

5. **Build failures:**
   - Ensure: Node.js 18+ is being used
   - Check: All dependencies are properly installed

**Debug Steps:**
1. Check Railway deploy logs for specific error messages
2. Verify environment variables in Railway dashboard
3. Test API endpoints individually (health check first)
4. Check API key balances and rate limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally with both API keys
5. Commit: `git commit -m "Add feature-name"`
6. Push: `git push origin feature-name`
7. Create a Pull Request

## 📝 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Live Demo**: [Your Railway URL]
- **Firecrawl API**: https://firecrawl.dev
- **Anthropic Claude**: https://console.anthropic.com
- **Railway Hosting**: https://railway.app

## 🆘 Support

**Need help?**
- 📧 Create an issue in this repository
- 💬 Check the troubleshooting section above
- 🔗 Railway docs: https://docs.railway.app
- 📖 Firecrawl docs: https://docs.firecrawl.dev
- 🤖 Anthropic docs: https://docs.anthropic.com

---

**Built with ❤️ for the growth community**

*Analyze. Optimize. Grow.* 🚀