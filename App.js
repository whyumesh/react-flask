import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);  // Track if recording is active
  const [videoBlob, setVideoBlob] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [output, setOutput] = useState("");  // Store generated output
  const [message, setMessage] = useState("Waiting for wake-up word...");  // Store message for UI feedback
  const [processing, setProcessing] = useState(false);  // Track if the app is processing the files

  useEffect(() => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
      console.log(`Heard: ${transcript}`);

      if (transcript === "Start" && !isRecording) {
        startRecording();
      } else if (transcript === "Stop" && isRecording) {
        stopRecording();
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [isRecording]);

  const startRecording = () => {
    console.log("Starting recording...");
    setIsRecording(true);
    setMessage("Recording has started. Say 'Tapas Stop' to stop.");  // Update UI message

    // Start video and audio recording
    const videoStream = navigator.mediaDevices.getDisplayMedia({ video: true });
    const audioStream = navigator.mediaDevices.getUserMedia({ audio: true });

    Promise.all([videoStream, audioStream]).then((streams) => {
      const mediaRecorder = new MediaRecorder(streams[0]);
      const audioRecorder = new MediaRecorder(streams[1]);

      let videoChunks = [];
      let audioChunks = [];

      mediaRecorder.ondataavailable = (e) => videoChunks.push(e.data);
      audioRecorder.ondataavailable = (e) => audioChunks.push(e.data);

      mediaRecorder.start();
      audioRecorder.start();

      const stopRecording = () => {
        mediaRecorder.stop();
        audioRecorder.stop();

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(videoChunks, { type: "video/mp4" });
          setVideoBlob(videoBlob);
        };

        audioRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          setAudioBlob(audioBlob);

          // Upload files once both audio and video are available
          uploadFiles(videoBlob, audioBlob);
        };

        setIsRecording(false);
        setMessage("Recording stopped. Processing the files...");  // Update UI message
      };

      window.stopRecording = stopRecording;
    });
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    if (window.stopRecording) {
      window.stopRecording();
    }
  };

  const uploadFiles = (video, audio) => {
    const formData = new FormData();
    formData.append("video", video);
    formData.append("audio", audio);
    
    setProcessing(true);  // Indicate that files are being processed

    fetch('/api/process', {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      setOutput(data.result);  // Set the generated output
      setMessage("Processing complete! Here's the generated output:");  // Update UI message
      setProcessing(false);  // Stop processing state
    })
    .catch(error => {
      console.error("Error:", error);
      setMessage("An error occurred while processing the files.");
      setProcessing(false);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Wake-Up Word Controlled Recording</h1>
        <p>{message}</p>  {/* Display dynamic messages based on the recording state */}

        {isRecording && <p>Recording... Say 'Tapas Stop' to stop.</p>}
        {processing && <p>Processing your files, please wait...</p>}

        {output && (
          <div>
            <h2>Generated Output:</h2>
            <p>{output}</p>  {/* Display the generated output */}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
