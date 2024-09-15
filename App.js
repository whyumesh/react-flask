import React, { useState } from 'react';

function App() {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const startRecording = async () => {
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
    }
  };

  const stopRecording = async () => {
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
    }
  };

  return (
    <div className="App">
      <h1>Screen and Audio Recorder</h1>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>

      {output && (
        <div>
          <h3>Processed Output:</h3>
          <p>{output}</p>
        </div>
      )}

      {error && (
        <div style={{ color: 'red' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
