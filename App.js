// App.js
import React, { useState } from 'react';
import './App.css';


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
