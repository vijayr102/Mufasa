import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { generateTests } from './api'
import { GenerateRequest, GenerateResponse, TestCase } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'testdata' | 'settings'>('main');
  const testDataTypes = [
    'Integer', 'Float', 'String', 'Boolean', 'Array/List', 'Object/JSON', 'Null', 'Date', 'Timestamp', 'Enum', 'Binary', 'UUID/GUID'
  ];
  const [testDataFields, setTestDataFields] = useState([
    { name: '', type: 'String' }
  ]);
  const [testDataResults, setTestDataResults] = useState<any[]>([]);
  const [testDataLoading, setTestDataLoading] = useState(false);
  const [testDataError, setTestDataError] = useState<string | null>(null);
  const [formData, setFormData] = useState<GenerateRequest>({
    storyTitle: '',
    acceptanceCriteria: '',
    description: '',
    additionalInfo: '',
    categories: [],
    jiraId: ''
  })
  const [results, setResults] = useState<GenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())
  const [settings, setSettings] = useState({
    groq_API_KEY: '',
    groq_MODEL: '',
    jiraUrl: '',
    jirausername: '',
    jiraapiKey: ''
  });
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const handleExport = () => {
    if (!results || !results.cases.length) return;
    const data = results.cases.map(tc => ({
      ID: tc.id,
      Title: tc.title,
      Category: tc.category,
      ExpectedResult: tc.expectedResult,
      Steps: tc.steps.join('\n'),
      TestData: tc.testData || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TestCases');
    XLSX.writeFile(wb, 'generated-test-cases.xlsx');
  }

  const toggleTestCaseExpansion = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases)
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId)
    } else {
      newExpanded.add(testCaseId)
    }
    setExpandedTestCases(newExpanded)
  }

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFetchJira = async () => {
    setError(null);
    if (!formData.jiraId?.trim()) {
      setError('Please enter a Jira ID to fetch.');
      return;
    }
    try {
      const res = await axios.post('/api/jira-summary', { jiraId: formData.jiraId });
      const data: any = res.data;
      setFormData(prev => ({
        ...prev,
        storyTitle: data.summary || '',
        acceptanceCriteria: data.description || ''
      }));
    } catch (err) {
      setError('Failed to fetch from JIRA.');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasStory = formData.storyTitle.trim() && formData.acceptanceCriteria.trim();
    const hasJira = formData.jiraId?.trim();
    if (!hasStory && !hasJira) {
      setError('Either Story Title and Acceptance Criteria, or Jira Id is required');
      return;
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await generateTests(formData)
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const set = new Set(prev.categories || [])
      if (set.has(category)) set.delete(category)
      else set.add(category)
      return { ...prev, categories: Array.from(set) }
    })
  }

  const handleSettingsChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);
    try {
      await axios.post('/api/settings', settings);
      setSettingsMsg('Settings saved successfully!');
    } catch (err) {
      setSettingsMsg('Failed to save settings.');
    }
  };

  return (
    <div>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 95%;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        
        @media (min-width: 768px) {
          .container {
            max-width: 90%;
            padding: 30px;
          }
        }
        
        @media (min-width: 1024px) {
          .container {
            max-width: 85%;
            padding: 40px;
          }
        }
        
        @media (min-width: 1440px) {
          .container {
            max-width: 1800px;
            padding: 50px;
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }
        
        .form-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        .form-input, .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .submit-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .submit-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .error-banner {
          background: #e74c3c;
          color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }
        
        .results-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .results-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e1e8ed;
        }
        
        .results-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .results-meta {
          color: #666;
          font-size: 14px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e8ed;
        }
        
        .results-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .results-table tr:hover {
          background: #f8f9fa;
        }
        
        .category-positive { color: #27ae60; font-weight: 600; }
        .category-negative { color: #e74c3c; font-weight: 600; }
        .category-edge { color: #f39c12; font-weight: 600; }
        .category-authorization { color: #9b59b6; font-weight: 600; }
        .category-non-functional { color: #34495e; font-weight: 600; }
        
        .test-case-id {
          cursor: pointer;
          color: #3498db;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .test-case-id:hover {
          background: #f8f9fa;
        }
        
        .test-case-id.expanded {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .expand-icon {
          font-size: 10px;
          transition: transform 0.2s;
        }
        
        .expand-icon.expanded {
          transform: rotate(90deg);
        }
        
        .expanded-details {
          margin-top: 15px;
          background: #fafbfc;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
        }
        
        .step-item {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .step-header {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        
        .step-id {
          font-weight: 600;
          color: #2c3e50;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }
        
        .step-description {
          color: #2c3e50;
          line-height: 1.5;
        }
        
        .step-test-data {
          color: #666;
          font-style: italic;
          font-size: 14px;
        }
        
        .step-expected {
          color: #27ae60;
          font-weight: 500;
          font-size: 14px;
        }
        
        .step-labels {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
      
      <div className="container">
        <div className="header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <h1 className="title">User Story to Tests</h1>
            <p className="subtitle">Generate comprehensive test cases from your user stories</p>
          </div>
          <div style={{display: 'flex', gap: 16}}>
            <button type="button" className={activeTab === 'main' ? 'submit-btn' : 'form-input'} style={{minWidth: 120}} onClick={() => setActiveTab('main')}>User Story to Tests</button>
            <button type="button" className={activeTab === 'testdata' ? 'submit-btn' : 'form-input'} style={{minWidth: 120}} onClick={() => setActiveTab('testdata')}>Generate Test Data</button>
            <button type="button" className={activeTab === 'settings' ? 'submit-btn' : 'form-input'} style={{minWidth: 120}} onClick={() => setActiveTab('settings')}>Settings</button>
          </div>
        </div>
        {activeTab === 'testdata' && (
          <div className="form-container">
            <h2 style={{marginBottom: 20}}>Test Data Schema</h2>
            <table className="results-table" style={{marginBottom: 20}}>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testDataFields.map((field, idx) => (
                  <tr key={idx}>
                    <td>
                      <input type="text" className="form-input" value={field.name} onChange={e => {
                        const arr = [...testDataFields];
                        arr[idx].name = e.target.value;
                        setTestDataFields(arr);
                      }} placeholder="Field name" />
                    </td>
                    <td>
                      <select className="form-input" value={field.type} onChange={e => {
                        const arr = [...testDataFields];
                        arr[idx].type = e.target.value;
                        setTestDataFields(arr);
                      }}>
                        {testDataTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </td>
                    <td style={{whiteSpace: 'nowrap'}}>
                      <button type="button" className="submit-btn" style={{padding: '4px 10px', fontSize: 12, marginRight: 4}} onClick={() => {
                        const arr = [...testDataFields];
                        arr.splice(idx, 1);
                        setTestDataFields(arr.length ? arr : [{ name: '', type: 'String' }]);
                      }}>Remove</button>
                      <button type="button" className="submit-btn" style={{padding: '4px 10px', fontSize: 12, marginRight: 4}} disabled={idx === 0} onClick={() => {
                        const arr = [...testDataFields];
                        [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
                        setTestDataFields(arr);
                      }}>↑</button>
                      <button type="button" className="submit-btn" style={{padding: '4px 10px', fontSize: 12}} disabled={idx === testDataFields.length-1} onClick={() => {
                        const arr = [...testDataFields];
                        [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
                        setTestDataFields(arr);
                      }}>↓</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="submit-btn" style={{marginBottom: 20}} onClick={() => setTestDataFields([...testDataFields, { name: '', type: 'String' }])}>Add Row</button>
            <button type="button" className="submit-btn" style={{marginLeft: 12}} onClick={async () => {
              setTestDataLoading(true);
              setTestDataError(null);
              try {
                const res = await axios.post('/api/generate-test-data', { fields: testDataFields });
                const data = res.data as { results?: any[] };
                setTestDataResults(data.results || []);
              } catch (err) {
                setTestDataError('Failed to generate test data');
              } finally {
                setTestDataLoading(false);
              }
            }}>Generate</button>
            {testDataError && <div className="error-banner">{testDataError}</div>}
            {testDataLoading && <div className="loading">Generating test data...</div>}
            {testDataResults.length > 0 && (
              <div className="results-container" style={{position: 'relative', marginTop: 30}}>
                <button
                  type="button"
                  className="submit-btn"
                  style={{position: 'absolute', top: 24, right: 24, zIndex: 2}}
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(testDataResults);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'TestData');
                    XLSX.writeFile(wb, 'generated-test-data.xlsx');
                  }}
                >
                  Export
                </button>
                <div className="results-header">
                  <h2 className="results-title">Generated Test Data</h2>
                </div>
                <div className="table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        {Object.keys(testDataResults[0]).map((col, i) => <th key={i}>{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {testDataResults.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => <td key={j}>{String(val)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'main' && (
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <label htmlFor="jiraId" className="form-label" style={{marginBottom: 0}}>
              Jira ID
            </label>
            <input
              type="text"
              id="jiraId"
              className="form-input"
              style={{flex: 1}}
              value={formData.jiraId}
              onChange={(e) => handleInputChange('jiraId', e.target.value)}
              placeholder="Jira ID (optional)..."
            />
            <button type="button" className="submit-btn" style={{whiteSpace: 'nowrap'}} onClick={handleFetchJira}>Fetch</button>
          </div>

          <div className="form-group">
            <label htmlFor="storyTitle" className="form-label">
              Story Title *
            </label>
            <input
              type="text"
              id="storyTitle"
              className="form-input"
              value={formData.storyTitle}
              onChange={(e) => handleInputChange('storyTitle', e.target.value)}
              placeholder="Enter the user story title..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional description (optional)..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="acceptanceCriteria" className="form-label">
              Acceptance Criteria *
            </label>
            <textarea
              id="acceptanceCriteria"
              className="form-textarea"
              value={formData.acceptanceCriteria}
              onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
              placeholder="Enter the acceptance criteria..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="additionalInfo" className="form-label">
              Additional Info
            </label>
            <textarea
              id="additionalInfo"
              className="form-textarea"
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Any additional information (optional)..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Categories
            </label>
            <div role="group" aria-label="Categories" style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
              {['Positive', 'Negative', 'Edge', 'Non-Functional', 'Security'].map((cat) => {
                const id = `cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                return (
                  <label key={cat} htmlFor={id} style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                    <input
                      type="checkbox"
                      id={id}
                      checked={formData.categories?.includes(cat) ?? false}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                )
              })}
            </div>
          </div>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSettingsSave} className="form-container">
            <div className="form-group">
              <label className="form-label" htmlFor="groq_API_KEY">Groq API Key</label>
              <input type="text" id="groq_API_KEY" className="form-input" value={settings.groq_API_KEY} onChange={e => handleSettingsChange('groq_API_KEY', e.target.value)} placeholder="Groq API Key" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="groq_MODEL">Groq Model</label>
              <input type="text" id="groq_MODEL" className="form-input" value={settings.groq_MODEL} onChange={e => handleSettingsChange('groq_MODEL', e.target.value)} placeholder="Groq Model" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="jiraUrl">JIRA URL</label>
              <input type="text" id="jiraUrl" className="form-input" value={settings.jiraUrl} onChange={e => handleSettingsChange('jiraUrl', e.target.value)} placeholder="JIRA URL" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="jirausername">JIRA Username</label>
              <input type="text" id="jirausername" className="form-input" value={settings.jirausername} onChange={e => handleSettingsChange('jirausername', e.target.value)} placeholder="JIRA Username" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="jiraapiKey">JIRA API Key</label>
              <input type="text" id="jiraapiKey" className="form-input" value={settings.jiraapiKey} onChange={e => handleSettingsChange('jiraapiKey', e.target.value)} placeholder="JIRA API Key" />
            </div>
            <button type="submit" className="submit-btn">Save</button>
            {settingsMsg && <div className="error-banner" style={{background: settingsMsg.includes('success') ? '#27ae60' : '#e74c3c'}}>{settingsMsg}</div>}
          </form>
        )}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            Generating test cases...
          </div>
        )}

        {results && (
          <div className="results-container" style={{position: 'relative'}}>
            <button
              type="button"
              className="submit-btn"
              style={{position: 'absolute', top: 24, right: 24, zIndex: 2}}
              onClick={handleExport}
            >
              Export
            </button>
            <div className="results-header">
              <h2 className="results-title">Generated Test Cases</h2>
              <div className="results-meta">
                {results.cases.length} test case(s) generated
                {results.model && ` • Model: ${results.model}`}
                {results.promptTokens > 0 && ` • Tokens: ${results.promptTokens + results.completionTokens}`}
              </div>
            </div>
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Test Case ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Expected Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.cases.map((testCase: TestCase) => (
                    <>
                      <tr key={testCase.id}>
                        <td>
                          <div 
                            className={`test-case-id ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}
                            onClick={() => toggleTestCaseExpansion(testCase.id)}
                          >
                            <span className={`expand-icon ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {testCase.id}
                          </div>
                        </td>
                        <td>{testCase.title}</td>
                        <td>
                          <span className={`category-${testCase.category.toLowerCase()}`}>
                            {testCase.category}
                          </span>
                        </td>
                        <td>{testCase.expectedResult}</td>
                      </tr>
                      {expandedTestCases.has(testCase.id) && (
                        <tr key={`${testCase.id}-details`}>
                          <td colSpan={4}>
                            <div className="expanded-details">
                              <h4 style={{marginBottom: '15px', color: '#2c3e50'}}>Test Steps for {testCase.id}</h4>
                              <div className="step-labels">
                                <div>Step ID</div>
                                <div>Step Description</div>
                                <div>Test Data</div>
                                <div>Expected Result</div>
                              </div>
                              {testCase.steps.map((step, index) => (
                                <div key={index} className="step-item">
                                  <div className="step-header">
                                    <div className="step-id">S{String(index + 1).padStart(2, '0')}</div>
                                    <div className="step-description">{step}</div>
                                    <div className="step-test-data">{testCase.testData || 'N/A'}</div>
                                    <div className="step-expected">
                                      {index === testCase.steps.length - 1 ? testCase.expectedResult : 'Step completed successfully'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
  </div>
    </div>
  )
}

export default App