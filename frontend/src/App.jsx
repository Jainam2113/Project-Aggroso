import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Inline toast notifications
function Toast({ toasts, dismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// Confirm dialog
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

let toastIdCounter = 0;

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [scopeMode, setScopeMode] = useState('all');
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const chatEndRef = useRef(null);

  // Health
  const [health, setHealth] = useState(null);

  const addToast = (message, type = 'info') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 4000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirm = (message) =>
    new Promise(resolve => {
      setConfirm({ message, resolve });
    });

  const handleConfirm = (result) => {
    if (confirm) confirm.resolve(result);
    setConfirm(null);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      addToast('Only .txt files are supported', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast(`"${file.name}" uploaded successfully`, 'success');
      fetchDocuments();
      e.target.value = '';
    } catch (error) {
      addToast('Upload failed: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id, name) => {
    const confirmed = await showConfirm(`Delete "${name}"?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/documents/${id}`);
      setSelectedDocIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      addToast('Document deleted', 'success');
      fetchDocuments();
    } catch (error) {
      addToast('Delete failed: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const toggleDocSelection = (id) => {
    setSelectedDocIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    if (documents.length === 0) {
      addToast('Upload at least one document first', 'warning');
      return;
    }

    const documentIds = scopeMode === 'select' ? [...selectedDocIds] : [];
    if (scopeMode === 'select' && documentIds.length === 0) {
      addToast('Select at least one document to query', 'warning');
      return;
    }

    const userMsg = { role: 'user', content: q, id: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ask`, { question: q, documentIds });
      const assistantMsg = {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
        id: Date.now() + 1
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errMsg = {
        role: 'error',
        content: 'Failed to get answer: ' + (error.response?.data?.error || error.message),
        id: Date.now() + 1
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const checkHealth = async () => {
    setHealth(null);
    try {
      const res = await axios.get(`${API_URL}/health`);
      setHealth(res.data);
    } catch (error) {
      setHealth({
        backend: 'unhealthy',
        database: 'unhealthy',
        llm: 'unhealthy',
        error: error.message
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'health') checkHealth();
  }, [activeTab]);

  return (
    <div className="app">
      <Toast toasts={toasts} dismiss={dismissToast} />
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}

      <header className="header">
        <h1>Knowledge Q&amp;A</h1>
        <p>Upload documents and ask questions</p>
      </header>

      <nav className="nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
          Home
        </button>
        <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>
          Documents ({documents.length})
        </button>
        <button className={activeTab === 'qa' ? 'active' : ''} onClick={() => setActiveTab('qa')}>
          Chat
        </button>
        <button className={activeTab === 'health' ? 'active' : ''} onClick={() => setActiveTab('health')}>
          Health
        </button>
      </nav>

      <main className="main">

        {/* HOME */}
        {activeTab === 'home' && (
          <div className="tab-content">
            <div className="card">
              <h2>Welcome to Knowledge Q&amp;A</h2>
              <p className="subtitle">Your AI-powered document assistant</p>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <h3>Upload Documents</h3>
                  <p>Add .txt files to the knowledge base</p>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <h3>Select Scope</h3>
                  <p>Chat with all docs or pick specific ones</p>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <h3>Get Answers</h3>
                  <p>AI answers with source citations</p>
                </div>
              </div>
              <button className="btn-primary" onClick={() => setActiveTab('documents')}>
                Get Started →
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="tab-content">
            <div className="card">
              <h2>Upload Document</h2>
              <div className="upload-box">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="upload-label">
                  {uploading ? 'Uploading...' : 'Choose .txt file'}
                </label>
                <p className="upload-hint">Only .txt files supported</p>
              </div>
            </div>

            <div className="card">
              <h2>Your Documents ({documents.length})</h2>
              {documents.length === 0 ? (
                <div className="empty-state">No documents yet. Upload your first document above.</div>
              ) : (
                <div className="doc-grid">
                  {documents.map(doc => (
                    <div key={doc.id} className="doc-card">
                      <div className="doc-icon">📄</div>
                      <div className="doc-info">
                        <h3>{doc.name}</h3>
                        <p className="doc-date">{new Date(doc.uploadedAt).toLocaleString()}</p>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {activeTab === 'qa' && (
          <div className="tab-content chat-layout">
            {/* Toolbar */}
            <div className="chat-toolbar">
              <div className="scope-bar">
                <span className="scope-label">Query:</span>
                <button
                  className={`scope-btn ${scopeMode === 'all' ? 'active' : ''}`}
                  onClick={() => setScopeMode('all')}
                >
                  All documents
                </button>
                <button
                  className={`scope-btn ${scopeMode === 'select' ? 'active' : ''}`}
                  onClick={() => setScopeMode('select')}
                >
                  Select documents
                </button>
              </div>
              {chatHistory.length > 0 && (
                <button className="btn-ghost" onClick={clearChat}>Clear chat</button>
              )}
            </div>

            {/* Doc checkboxes */}
            {scopeMode === 'select' && documents.length > 0 && (
              <div className="doc-checkboxes">
                {documents.map(doc => (
                  <label
                    key={doc.id}
                    className={`doc-checkbox-item ${selectedDocIds.has(doc.id) ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.has(doc.id)}
                      onChange={() => toggleDocSelection(doc.id)}
                    />
                    {doc.name}
                  </label>
                ))}
              </div>
            )}

            {/* Chat window */}
            <div className="chat-window">
              {chatHistory.length === 0 && !loading ? (
                <div className="chat-empty">
                  {documents.length === 0 ? (
                    <>
                      <p>No documents uploaded yet.</p>
                      <button className="btn-primary" onClick={() => setActiveTab('documents')}>
                        Upload Documents →
                      </button>
                    </>
                  ) : (
                    <p>Ask anything about your {documents.length} document{documents.length !== 1 ? 's' : ''}.</p>
                  )}
                </div>
              ) : (
                <>
                  {chatHistory.map(msg => (
                    <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                      {msg.role === 'user' && (
                        <div className="bubble bubble-user">{msg.content}</div>
                      )}
                      {msg.role === 'assistant' && (
                        <div className="bubble-wrapper">
                          <div className="bubble bubble-assistant">{msg.content}</div>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="sources-inline">
                              <span className="sources-label">Sources</span>
                              {msg.sources.map((src, i) => (
                                <details key={i} className="source-item">
                                  <summary>{src.documentName}</summary>
                                  <p>"{src.text}"</p>
                                </details>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {msg.role === 'error' && (
                        <div className="bubble bubble-error">{msg.content}</div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="chat-msg chat-msg-assistant">
                      <div className="bubble bubble-assistant typing-indicator">
                        <span /><span /><span />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={documents.length === 0 ? 'Upload a document first...' : 'Ask a question...'}
                rows="2"
                disabled={loading || documents.length === 0}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button type="submit" disabled={loading || !question.trim() || documents.length === 0}>
                {loading ? '…' : 'Send'}
              </button>
            </form>
            <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
          </div>
        )}

        {/* HEALTH */}
        {activeTab === 'health' && (
          <div className="tab-content">
            <div className="card">
              <h2>System Health</h2>
              <button onClick={checkHealth} className="btn-secondary" style={{ marginBottom: '0.75rem' }}>
                Refresh
              </button>
              {health ? (
                <div className="health-grid">
                  {[
                    { key: 'backend', label: 'Backend' },
                    { key: 'database', label: 'Database' },
                    { key: 'llm', label: 'LLM (Gemini)' }
                  ].map(({ key, label }) => (
                    <div key={key} className={`health-card ${health[key] === 'healthy' ? 'healthy' : 'unhealthy'}`}>
                      <div className="health-icon">{health[key] === 'healthy' ? '✅' : '❌'}</div>
                      <h3>{label}</h3>
                      <p className="status">{health[key]}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Checking...</p>
              )}
              {health?.timestamp && (
                <p className="timestamp">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Knowledge Q&amp;A — Powered by Gemini</p>
      </footer>
    </div>
  );
}

export default App;
