import React, { useState } from 'react'

// TODO: Update this to your Railway backend URL when deployed
// For development, this will proxy through Vite to localhost:3000
const API_BASE_URL = import.meta.env.DEV ? '/api' : '/api';

function App() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')

  // URL validation regex
  const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

  const validateUrl = (url) => {
    if (!url.trim()) {
      return 'Please enter a website URL'
    }
    
    if (!URL_REGEX.test(url.trim())) {
      return 'Please enter a valid URL (including http:// or https://)'
    }
    
    return null
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    
    // Clear previous results
    setError('')
    setAnalysisResult(null)
    
    // Validate URL
    const validationError = validateUrl(url)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsAnalyzing(true)

    try {
      console.log('🔍 Starting analysis for:', url)
      
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Analysis failed')
      }

      console.log('✅ Analysis completed:', data)
      setAnalysisResult(data)

    } catch (err) {
      console.error('❌ Analysis error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 65) return 'score-good'
    if (score >= 45) return 'score-fair'
    return 'score-poor'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 65) return 'Good'
    if (score >= 45) return 'Fair'
    return 'Needs Improvement'
  }

  const handleNewAnalysis = () => {
    setUrl('')
    setAnalysisResult(null)
    setError('')
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 style={{ color: 'white', marginBottom: '1rem' }}>
          AI-Powered Website Growth Analysis
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Get instant, professional feedback on your website's growth potential. No signup required - just enter your URL and get AI-powered insights.
        </p>
        
        {/* Feature highlights */}
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            Claude AI analysis
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            Growth 101 principles
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            Results in 60 seconds
          </div>
        </div>
      </div>

      {/* Main Analysis Form */}
      {!analysisResult && (
        <div className="card">
          <div className="card-header">
            <h2>AI-Powered Website Growth Analyzer</h2>
            <p style={{ color: '#6b7280', marginBottom: 0 }}>
              Get instant AI feedback on your onboarding, UX, and growth potential
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '0.5rem' }}>
              🤖 Powered by Claude AI • No API keys required • Just enter your URL
            </p>
          </div>

          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://satvikputi.com/"
                className={`form-input ${error ? 'error' : ''}`}
                disabled={isAnalyzing}
                autoFocus
              />
              {error && (
                <div className="error-message">{error}</div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isAnalyzing}
              style={{ width: '100%' }}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner"></span>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  ⚡ Analyze with AI
                </>
              )}
            </button>
          </form>

          <p style={{ 
            textAlign: 'center', 
            fontSize: '14px', 
            color: '#9ca3af', 
            marginTop: '1rem',
            marginBottom: 0 
          }}>
            🌟 Professional Growth 101 analysis powered by AI
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="card">
          <div className="card-header">
            <div className="text-center">
              <div className={`score-circle ${getScoreClass(analysisResult.analysis.score)}`}>
                {analysisResult.analysis.score}
              </div>
              <h2>{getScoreLabel(analysisResult.analysis.score)}</h2>
              <p style={{ color: '#6b7280' }}>
                Analysis for: <strong>{analysisResult.url}</strong>
              </p>
            </div>
          </div>

          {/* Summary */}
          {analysisResult.analysis.summary && (
            <div className="mb-3">
              <h3>Summary</h3>
              <p>{analysisResult.analysis.summary}</p>
            </div>
          )}

          {/* Categories Breakdown */}
          {analysisResult.analysis.categories && analysisResult.analysis.categories.length > 0 && (
            <div className="mb-3">
              <h3>Detailed Analysis</h3>
              {analysisResult.analysis.categories.map((category, index) => (
                <div key={index} style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  background: '#f9fafb', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <h4 style={{ margin: 0 }}>{category.name}</h4>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: category.score >= 15 ? '#10b981' : category.score >= 10 ? '#f59e0b' : '#ef4444' 
                    }}>
                      {category.score}/{category.name.includes('Conversion') ? '25' : category.name.includes('Technical') ? '15' : '20'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#4b5563' }}>{category.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {analysisResult.analysis.recommendations && analysisResult.analysis.recommendations.length > 0 && (
            <div className="mb-3">
              <h3>Actionable Recommendations</h3>
              {analysisResult.analysis.recommendations.map((rec, index) => (
                <div key={index} style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      background: rec.priority === 'High' ? '#fef2f2' : rec.priority === 'Medium' ? '#fffbeb' : '#f0fdf4',
                      color: rec.priority === 'High' ? '#dc2626' : rec.priority === 'Medium' ? '#d97706' : '#16a34a'
                    }}>
                      {rec.priority} Priority
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Effort: {rec.effort}
                    </span>
                  </div>
                  <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{rec.action}</p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{rec.impact}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center">
            <button 
              onClick={handleNewAnalysis}
              className="btn btn-primary"
            >
              🔍 Analyze Another Website
            </button>
          </div>

          {/* Timestamp */}
          <p style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            color: '#9ca3af', 
            marginTop: '1rem',
            marginBottom: 0 
          }}>
            Analysis completed on {new Date(analysisResult.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

export default App