import os
import threading
import pyautogui
import numpy as np
import cv2
import pyaudio
import wave
from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import google.generativeai as genai

# Google GenAI configuration
API_KEY = "AIzaSyDd9MceKFYXZV9cI0SxS0ATCOOEGaRdgEI"  # Replace with your actual API key
genai.configure(api_key=API_KEY)
code_model = genai.GenerativeModel('gemini-1.5-flash')

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK = 1024

# File paths
audio_filename = "output.wav"
video_filename = "output.mp4"
upload_dir = './uploaded_files'
os.makedirs(upload_dir, exist_ok=True)

app = Flask(__name__)
CORS(app)

def cleanup_files():
    """Deletes old recording files."""
    for file in [audio_filename, video_filename]:
        file_path = os.path.join(upload_dir, file)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted old file: {file}")

def record_audio(filename, stop_event):
    """Records audio."""
    audio = pyaudio.PyAudio()
    stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
    frames = []

    while not stop_event.is_set():
        frames.append(stream.read(CHUNK))

    stream.stop_stream()
    stream.close()
    audio.terminate()

    with wave.open(os.path.join(upload_dir, filename), 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(audio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))

def record_screen(filename, stop_event):
    """Records screen with mouse cursor position."""
    screen_size = pyautogui.size()
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(os.path.join(upload_dir, filename), fourcc, 8, (screen_size.width, screen_size.height))

    while not stop_event.is_set():
        img = pyautogui.screenshot()
        frame = cv2.cvtColor(np.array(img), cv2.COLOR_BGR2RGB)
        x, y = pyautogui.position()
        cv2.circle(frame, (x, y), 10, (0, 255, 0), -1)  # Highlight mouse
        out.write(frame)

    out.release()

def run_genai_logic(audio_file, video_file):
    """Processes the audio and video files through the Google GenAI model."""
    try:
        # Upload files to GenAI
        audio_file_obj = genai.upload_file(path=audio_file)
        video_file_obj = genai.upload_file(path=video_file)

        # Poll until processing is done
        while audio_file_obj.state.name == "PROCESSING" or video_file_obj.state.name == "PROCESSING":
            time.sleep(5)
            audio_file_obj = genai.get_file(audio_file_obj.name)
            video_file_obj = genai.get_file(video_file_obj.name)

        # Send audio and video for analysis
        prompt = prompt = """
1. Audio Issue Identification:
   - Listen to the provided audio file.
   - Identify and clearly describe the specific issue mentioned in the audio.

2. Video Content Extraction:
   - Based on the identified issue, extract relevant segments from the provided video file that directly relate to the described issue.

3. Task on Video Data:
   - Perform the task(s) described in the audio file on the extracted video content (e.g., analyze, summarize, enhance, etc.).

4. Provide the result in the following structured format:

## **Error Analysis: [Brief Issue Description]**

**Issue:** [Describe the issue identified in the audio]

**Observation:** [Summarize the video content related to the issue]

**Analysis:**

* **Cause 1:** [Explain the primary cause of the issue]
* **Cause 2:** [Provide additional insights, if applicable]

**Solution:**

1. **Step 1:** [First solution step]
2. **Step 2:** [Second solution step]
3. **Step 3:** [Additional steps, if any]

By following these steps, you should be able to resolve the issue successfully.
"""


        response = code_model.generate_content([audio_file_obj, video_file_obj, prompt])
        
        return response.text

    except Exception as e:
        print(f"Error in GenAI processing: {e}")
        return None

@app.route('/api/start_recording', methods=['POST'])
def start_recording():
    """Starts audio and screen recording."""
    try:
        cleanup_files()
        stop_event = threading.Event()
        audio_thread = threading.Thread(target=record_audio, args=(audio_filename, stop_event))
        screen_thread = threading.Thread(target=record_screen, args=(video_filename, stop_event))

        audio_thread.start()
        screen_thread.start()

        app.config.update({
            'stop_event': stop_event,
            'audio_thread': audio_thread,
            'screen_thread': screen_thread
        })

        return jsonify({"status": "recording_started"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stop_recording', methods=['POST'])
def stop_recording():
    """Stops recording and sends files to GenAI for analysis."""
    try:
        stop_event = app.config['stop_event']
        stop_event.set()

        app.config['audio_thread'].join()
        app.config['screen_thread'].join()

        # Analyze files
        result = run_genai_logic(os.path.join(upload_dir, audio_filename), os.path.join(upload_dir, video_filename))

        if result:
            return jsonify({"status": "success", "result": {"analysis": result}})
        else:
            return jsonify({"status": "error", "message": "Failed to process files"}), 500

    except Exception as e:
        print(f"Error in stop_recording: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/process_input', methods=['POST'])
def process_input():
    """Handles general input processing."""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Dummy response for now
        return jsonify({"response": f"Processed result for prompt: {prompt}"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
