import React, { useState } from 'react';
import './App.css'; // Importing the CSS file for custom styles

function App() {
  const [outputs, setOutputs] = useState([]); // Store multiple outputs
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');

  const startRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/start_recording', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        console.log('Recording started:', result);
        setError('');
      } else {
        console.error('Error starting recording:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
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
        console.log('Recording stopped successfully:', result);
        setOutputs(prevOutputs => [...prevOutputs, result.result]); // Add new output to array
        setError('');
      } else {
        console.error('Error stopping recording:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
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
      setOutputs(prevOutputs => [...prevOutputs, result.response]); // Continue conversation with new response
      setInputPrompt('');
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Hello, Dev</h1>
      <h2 className="app-subtitle">How Can I Help You Today?</h2>

      <div className="button-container">
        <button className="start-btn" onClick={startRecording} disabled={loading}>
          {loading ? 'Starting...' : 'Start Recording'}
        </button>
        <button className="stop-btn" onClick={stopRecording} disabled={loading}>
          {loading ? 'Stopping...' : 'Stop Recording'}
        </button>
      </div>

      <div className="output-container">
        {outputs.length > 0 && outputs.map((output, index) => (
          <div key={index} className="output-message">
            <h3 className="output-heading">Processed Output {index + 1}:</h3>
            <div className="output-box">
              <p className="output-text">{output}</p>
            </div>
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
  );
}

export default App;
