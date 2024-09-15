import React, { useState } from 'react';
import './App.css'; // Importing the CSS file for custom styles

function App() {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // To handle the loading state

  const startRecording = async () => {
    setLoading(true); // Start loading when recording starts
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
      setLoading(false); // Stop loading when the operation is done
    }
  };

  const stopRecording = async () => {
    setLoading(true); // Start loading when stopping the recording
    try {
      const response = await fetch('/api/stop_recording', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        console.log('Recording stopped successfully:', result);
        setOutput(result.result); // Display the result from the processed file
        setError('');
      } else {
        console.error('Error stopping recording:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false); // Stop loading when the operation is done
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">AI Recorder Interface</h1>
      <div className="button-container">
        <button className="start-btn" onClick={startRecording} disabled={loading}>
          {loading ? 'Starting...' : 'Start Recording'}
        </button>
        <button className="stop-btn" onClick={stopRecording} disabled={loading}>
          {loading ? 'Stopping...' : 'Stop Recording'}
        </button>
      </div>

      <div className="output-container">
        {output && (
          <div className="output-message">
            <h3>Processed Output:</h3>
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
  );
}

export default App;
