import os
import threading
import pyautogui
import numpy as np
import cv2
import pyaudio
import wave
import moviepy.editor as mp
from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import google.generativeai as genai

# Load environment variables
API_KEY = "AIzaSyDd9MceKFYXZV9cI0SxS0ATCOOEGaRdgEI"
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
final_filename = "final_output.mp4"
upload_dir = './uploaded_files'

if not os.path.exists(upload_dir):
    os.makedirs(upload_dir)

app = Flask(__name__)
CORS(app)

def cleanup_files():
    """Deletes old files before a new recording session starts."""
    files_to_delete = [audio_filename, video_filename, final_filename]
    for file in files_to_delete:
        file_path = os.path.join(upload_dir, file)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted old file: {file}")

def record_audio(filename, stop_event):
    audio = pyaudio.PyAudio()
    stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
    frames = []
    while not stop_event.is_set():
        data = stream.read(CHUNK)
        frames.append(data)

    stream.stop_stream()
    stream.close()
    audio.terminate()

    with wave.open(os.path.join(upload_dir, filename), 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(audio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))

def record_screen(filename, stop_event, mouse_positions):
    screen_size = pyautogui.size()
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(os.path.join(upload_dir, filename), fourcc, 8, (screen_size.width, screen_size.height))

    while not stop_event.is_set():
        img = pyautogui.screenshot()
        frame = np.array(img)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        x, y = pyautogui.position()
        cv2.circle(frame, (x, y), 10, (0, 255, 0), -1)
        out.write(frame)
        mouse_positions.append((x, y))

    out.release()

def combine_and_cleanup(video_filename, audio_filename, final_filename):
    video_clip = None
    audio_clip = None
    try:
        video_clip = mp.VideoFileClip(os.path.join(upload_dir, video_filename))
        audio_clip = mp.AudioFileClip(os.path.join(upload_dir, audio_filename))
        video_clip = video_clip.set_audio(audio_clip)
        final_path = os.path.join(upload_dir, final_filename)
        video_clip.write_videofile(final_path, codec='libx264')
    except Exception as e:
        print(f"Error during file combination: {e}")
    finally:
        if video_clip:
            video_clip.close()
        if audio_clip:
            audio_clip.close()

    return final_path

def run_genai_logic_audio(audio_file):
    """Generates a response by converting the audio file to text."""
    my_audio_file = genai.upload_file(path=audio_file)
    
    while my_audio_file.state.name == "PROCESSING":
        time.sleep(5)
        my_audio_file = genai.get_file(my_audio_file.name)
    
    # The prompt to understand the audio and convert it into text
    prompt = "Understand the audio and convert the audio into text. and provide optimized code"
    response = code_model.generate_content([my_audio_file, prompt])
    return response.text

# Function to route the task based on code-related classification
def route_based_on_classification(transcribed_text, video_file, selected_lines):
    """
    Provides a detailed error explanation, steps to solve, and the corrected code.
    """
    prompt = f"""
    1. **Explanation of the Error**: Analyze the video '{video_file}' and the spoken issue '{transcribed_text}' to identify the specific problem in the code lines '{selected_lines}'. Clearly explain the cause of the error.
    2. **Approach to Solve the Error**: Outline the steps needed to resolve the error, focusing on the necessary code changes or adjustments.
    3. **Corrected Code**: Provide the corrected version of the code that addresses the identified issue.
    4. **Summary**: Conclude with a brief summary of the solution, emphasizing the key points and how the changes fix the problem.
    """
    
    # Upload video file to Gemini API
    my_video_file = genai.upload_file(path=video_file)
    while my_video_file.state.name == "PROCESSING":
        time.sleep(5)
        my_video_file = genai.get_file(my_video_file.name)
    
    # Generate content based on video and prompt
    video_response = code_model.generate_content([my_video_file, prompt])
    return video_response.text

@app.route('/api/start_recording', methods=['POST'])
def start_recording():
    try:
        stop_event = threading.Event()
        cleanup_files()

        audio_thread = threading.Thread(target=record_audio, args=(audio_filename, stop_event))
        mouse_positions = []
        screen_thread = threading.Thread(target=record_screen, args=(video_filename, stop_event, mouse_positions))

        audio_thread.start()
        screen_thread.start()

        app.config['stop_event'] = stop_event
        app.config['audio_thread'] = audio_thread
        app.config['screen_thread'] = screen_thread

        return jsonify({"status": "recording_started"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stop_recording', methods=['POST'])
def stop_recording():
    try:
        stop_event = app.config['stop_event']
        stop_event.set()

        audio_thread = app.config['audio_thread']
        screen_thread = app.config['screen_thread']

        audio_thread.join()
        screen_thread.join()

        final_path = combine_and_cleanup(video_filename, audio_filename, final_filename)

        # Analyze both audio and video
        transcribed_text = run_genai_logic_audio(os.path.join(upload_dir, audio_filename))
        selected_lines = "Captured code lines based on cursor position and analysis"
        result = route_based_on_classification(transcribed_text, os.path.join(upload_dir, video_filename), selected_lines)

        return jsonify({"status": "recording_stopped", "file_path": final_path, "result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process_input', methods=['POST'])
def process_input():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')

        # Check if the prompt is empty
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Simulating processing (e.g., sending to a generative model)
        response_text = f"Processed result for prompt: {prompt}"

        # Return the processed result
        return jsonify({"response": response_text}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
