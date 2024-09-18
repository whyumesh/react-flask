import React, { useState } from 'react';
import './App.css'; // Ensure CSS is imported

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(''); // Store the response from the backend
  const [error, setError] = useState(''); // Store any errors

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const stopRecording = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await fetch('/api/stop_recording', { method: 'POST' });
      const result = await response.json();

      // Debugging: Log the response from the API
      console.log('API Response:', result);

      if (response.ok) {
        // Check if the result contains an analysis
        if (result.status === 'success' && result.result && result.result.analysis) {
          setOutput(result.result.analysis); // Set the output
        } else {
          setError('No analysis returned from the server');
        }
      } else {
        setError(result.message || 'Error occurred while processing');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {!sidebarVisible && (
        <img
          src="public/sidebar.png" 
          alt="Toggle Sidebar"
          className="toggle-sidebar-icon"
          onClick={toggleSidebar}
        />
      )}

      {sidebarVisible && (
        <div className="sidebar">
          {/* Sidebar content goes here */}
          <button onClick={toggleSidebar}>Close</button>
        </div>
      )}

      <div className="main-content">
        <h1 className="app-title">EternIQ</h1>
        <h2 className="app-subtitle">Your Coding Partner</h2>

        <div className="button-container">
          <button className="stop-btn" onClick={stopRecording} disabled={loading}>
            {loading ? 'Processing...' : 'Stop Recording'}
          </button>
        </div>

        <div className="output-container">
          {output && (
            <div className="output-message">
              <h3>Analysis:</h3>
              <p>{output}</p>
            </div>
          )}
          {error && (
            <div className="error-message">
              <h3>Error:</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
