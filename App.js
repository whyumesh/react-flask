import React, { useState } from 'react';
import './App.css';

function App() {
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [sessions, setSessions] = useState([]); // Array to manage session list
  const [currentSession, setCurrentSession] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sidebar visibility

  const startRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/start_recording', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stop_recording', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setOutputs(prevOutputs => [...prevOutputs, result.result]);
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrompt = async (e) => {
    e.preventDefault();
    if (inputPrompt.trim() === '') {
      setError('Please enter a prompt');
      return;
    }

    const conversationContext = outputs.length > 0 
      ? outputs.map((output, index) => `Output ${index + 1}: ${output}`).join('\n') + '\n' + inputPrompt
      : inputPrompt;

    try {
      setLoading(true);
      const response = await fetch('/api/process_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: conversationContext }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unexpected error occurred');
      }

      const result = await response.json();
      setOutputs(prevOutputs => [...prevOutputs, result.response]);
      setInputPrompt('');
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Start a new session
  const startNewSession = () => {
    const newSession = `Session ${sessions.length + 1}`;
    setSessions([newSession, ...sessions]);
    setCurrentSession(newSession);
    setOutputs([]); // Clear previous session output
  };

  return (
    <div className="app-container">
      {isSidebarVisible ? (
        <div className="sidebar">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            Hide Sidebar
          </button>
          <button className="new-session-btn" onClick={startNewSession}>New Session</button>
          <div className="session-list">
            {sessions.map((session, index) => (
              <div
                key={index}
                className={`session-item ${currentSession === session ? 'active' : ''}`}
                onClick={() => setCurrentSession(session)}
              >
                {session}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <img
          src="/public/sidebar.png" // Update the path if needed
          alt="Show Sidebar"
          className="toggle-sidebar-icon"
          onClick={toggleSidebar}
        />
      )}

      <div className="main-content">
        <h1 className="app-title">EternIQ</h1>
        <h2 className="app-subtitle">Your  Eternal Coding Partner</h2>

        <div className="button-container">
          <button className="start-btn" onClick={startRecording} disabled={loading}>
            {loading ? 'Starting...' : 'Start EternIQ'}
          </button>
          <button className="stop-btn" onClick={stopRecording} disabled={loading}>
            {loading ? 'Stopping...' : 'Stop EternIQ'}
          </button>
        </div>

        <div className="output-container">
          {outputs.length > 0 && outputs.map((output, index) => (
            <div key={index} className="output-message">
              <h3>Processed Output {index + 1}:</h3>
              <p>{output}</p>
            </div>
          ))}
          {error && (
            <div className="error-message">
              <h3>Error:</h3>
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="input-container">
          <input
            type="text"
            placeholder="Enter the Prompt Here"
            className="input-prompt"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
          <button
            type="submit"
            className="submit-btn"
            onClick={handleSubmitPrompt}
            disabled={loading || !inputPrompt.trim()}
          >
            <i className="fas fa-arrow-right submit-icon"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
