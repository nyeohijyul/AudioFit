import os
from decouple import config
import os


def _get_credentials(sa_path: str | None):
    # Import locally to avoid hard dependency at module import time
    try:
        from google.oauth2 import service_account
    except Exception:
        return None

    # Check for raw JSON env variable first (ideal for cloud platforms like Render)
    google_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
    if google_json:
        import json
        try:
            return service_account.Credentials.from_service_account_info(json.loads(google_json))
        except Exception:
            pass

    if not sa_path:
        sa_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', '')

    # If no env var provided, try repository fallback: backend/firebase-service-account.json
    if not sa_path:
        from pathlib import Path
        backend_root = Path(__file__).resolve().parents[2]
        fallback = backend_root / 'firebase-service-account.json'
        if fallback.exists():
            sa_path = str(fallback)

    if sa_path:
        if not os.path.isabs(sa_path):
            from pathlib import Path
            sa_path = str(Path(sa_path))
        try:
            return service_account.Credentials.from_service_account_file(sa_path)
        except Exception:
            pass
    return None


def generate_speech(text: str, language_code: str = 'ko-KR', voice_name: str = 'ko-KR-Neural2-A') -> bytes:
    """Generate MP3 audio bytes from text using Google Cloud Text-to-Speech.

    This function lazily imports Google Cloud libraries, and falls back to gTTS
    if Google Cloud credentials or service is unavailable.
    """
    if not text or not isinstance(text, str):
        raise ValueError('text must be a non-empty string')

    try:
        from google.cloud import texttospeech
        sa_path = config('GOOGLE_APPLICATION_CREDENTIALS', default=None)
        credentials = _get_credentials(sa_path)
        
        client = texttospeech.TextToSpeechClient(credentials=credentials) if credentials is not None else texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(language_code=language_code, name=voice_name)
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
        
        response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
        return response.audio_content
    except Exception as exc:
        # If Google Cloud setup or API call fails, gracefully fall back to gTTS
        msg = str(exc)
        try:
            from gtts import gTTS
            from io import BytesIO

            # Extract 2-letter language code from ko-KR, en-US, etc.
            lang = language_code.split('-')[0] if '-' in language_code else 'ko'
            tts = gTTS(text, lang=lang)
            buf = BytesIO()
            tts.write_to_fp(buf)
            return buf.getvalue()
        except Exception as fallback_exc:
            # If fallback also fails, raise original helpful error
            raise RuntimeError(f'TTS 생성 실패: {msg} (폴백 오류: {str(fallback_exc)})') from exc
