// App.js
import React, { useState } from 'react';
import './App.css';

function App() {
  const [outputs, setOutputs] = useState([]); // Array to store all outputs
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [sessions, setSessions] = useState([]); // Array to handle sessions
  const [currentSession, setCurrentSession] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Function to start recording
  const startRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/start_recording', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setError(''); // Clear any errors
      } else {
        setError(result.error); // Show error if API fails
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };

  // Function to stop recording and get AI analysis
  const stopRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stop_recording', { method: 'POST' });
      const result = await response.json();
      
      // Debugging: Log the response from the backend
      console.log('API Response:', result);

      if (response.ok) {
        // Append the new result to the outputs array
        setOutputs(prevOutputs => [...prevOutputs, result.result.analysis]);
        setError('');
      } else {
        setError(result.error); // Show error if something went wrong
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };

  // Submit a user input prompt to the backend
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
      setOutputs(prevOutputs => [...prevOutputs, result.response]); // Add new output
      setInputPrompt(''); // Clear the prompt input field
      setError('');
    } catch (error) {
      setError(error.message); // Set error if any
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Start a new session for recording
  const startNewSession = () => {
    const newSession = `Session ${sessions.length + 1}`;
    setSessions([newSession, ...sessions]);
    setCurrentSession(newSession);
    setOutputs([]); // Clear outputs for the new session
  };

  // Helper function to format the output (splitting text and code)
  const formatOutput = (output) => {
    // Example of splitting text from code using regex, adjust as needed
    const regex = /```(.*?)```/gs; // Regex to capture code blocks
    const parts = output.split(regex);
    
    return parts.map((part, index) => (
      index % 2 === 1 ? ( // If it's a code block
        <pre className="code-block" key={index}>{part}</pre>
      ) : ( // If it's normal text/context
        <p className="output-text" key={index}>{part}</p>
      )
    ));
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
          src="/public/sidebar.png"
          alt="Show Sidebar"
          className="toggle-sidebar-icon"
          onClick={toggleSidebar}
        />
      )}

      <div className="main-content">
        <h1 className="app-title">EternIQ</h1>
        <h2 className="app-subtitle">Your Eternal Coding Partner</h2>

        <div className="button-container">
          <button className="start-btn" onClick={startRecording} disabled={loading}>
            {loading ? 'Starting...' : 'Start EternIQ'}
          </button>
          <button className="stop-btn" onClick={stopRecording} disabled={loading}>
            {loading ? 'Stopping...' : 'Stop EternIQ'}
          </button>
        </div>

        <div className="output-container">
          {/* Display all the outputs */}
          {outputs.length > 0 && outputs.map((output, index) => (
            <div className="output-message" key={index}>
              <h3>Processed Output {index + 1}</h3>
              <div>{formatOutput(output)}</div>
            </div>
          ))}

          {/* Display error messages */}
          {error && (
            <div className="error-message">
              <h3>Error:</h3>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Input field for user prompt */}
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
