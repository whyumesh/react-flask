from flask import Flask, request, jsonify
import os
import google.generativeai as genai
import time

# Google GenAI configuration
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
code_model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__)

@app.route('/api/process', methods=['POST'])
def process_files():
    if 'video' not in request.files or 'audio' not in request.files:
        return jsonify({"error": "No video or audio file found"}), 400
    
    # Save the uploaded files
    video = request.files['video']
    audio = request.files['audio']
    video.save("uploaded_video.mp4")
    audio.save("uploaded_audio.wav")

    # Process the audio with GenAI
    transcribed_text = transcribe_audio("uploaded_audio.wav")

    # Generate output based on the transcription and video
    output = generate_output(transcribed_text, "uploaded_video.mp4")

    return jsonify({"result": output})

def transcribe_audio(audio_file):
    """Transcribe audio using Google GenAI."""
    my_audio_file = genai.upload_file(path=audio_file)
    
    while my_audio_file.state.name == "PROCESSING":
        time.sleep(5)
        my_audio_file = genai.get_file(my_audio_file.name)
    
    prompt = "Convert this audio to text."
    response = code_model.generate_content([my_audio_file, prompt])
    return response.text

def generate_output(transcribed_text, video_file):
    """Generate content based on transcribed text and video."""
    prompt = f"""
    Analyze the video '{video_file}' and the transcription '{transcribed_text}' to explain the issue.
    Provide a solution and corrected code if relevant.
    """
    video_response = code_model.generate_content([video_file, prompt])
    return video_response.text

if __name__ == '__main__':
    app.run(debug=True)
