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

    This function lazily imports Google Cloud libraries and raises an informative
    exception if they are not installed.
    """
    if not text or not isinstance(text, str):
        raise ValueError('text must be a non-empty string')

    try:
        from google.cloud import texttospeech
    except Exception as exc:
        raise RuntimeError('google-cloud-texttospeech 패키지가 설치되어 있지 않습니다. pip install -r backend/requirements.txt 후 재시도하세요.') from exc

    sa_path = config('GOOGLE_APPLICATION_CREDENTIALS', default=None)
    credentials = _get_credentials(sa_path)
    # Create client with explicit credentials if available, otherwise rely on Application Default Credentials.
    try:
        client = texttospeech.TextToSpeechClient(credentials=credentials) if credentials is not None else texttospeech.TextToSpeechClient()
    except Exception as exc:
        # Provide a clearer error when ADC are not found
        msg = str(exc)
        if 'default credentials' in msg.lower() or 'could not automatically determine credentials' in msg.lower():
            raise RuntimeError(
                'TTS 생성 실패: Google Application Default Credentials를 찾을 수 없습니다. ' 
                '서비스 계정 키 파일 경로를 환경변수 `GOOGLE_APPLICATION_CREDENTIALS`로 설정하거나 ' 
                'backend/firebase-service-account.json 파일을 배치해 주세요. 자세한 내용: https://cloud.google.com/docs/authentication/external/set-up-adc'
            ) from exc
        raise

    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(language_code=language_code, name=voice_name)
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

    try:
        response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
        return response.audio_content
    except Exception as exc:
        # If Google TTS is disabled or credentials fail, attempt a lightweight fallback using gTTS
        msg = str(exc)
        try:
            from gtts import gTTS
            from io import BytesIO

            tts = gTTS(text, lang='ko')
            buf = BytesIO()
            tts.write_to_fp(buf)
            return buf.getvalue()
        except Exception:
            # If fallback also fails, raise original helpful error
            raise RuntimeError(f'TTS 생성 실패: {msg}') from exc
