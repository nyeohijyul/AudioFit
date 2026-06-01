import json
import re
import urllib.request

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled, VideoUnavailable

import os
import tempfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COOKIES_PATH = os.path.join(BASE_DIR, 'cookies.txt')
COOKIES_ENV = os.getenv('YOUTUBE_COOKIES_TEXT')

if COOKIES_ENV:
    # 💡 [자동 판별] 로컬 .env에 적은 값이 '진짜 존재하는 파일 경로'인지 검사합니다.
    if os.path.exists(COOKIES_ENV):
        # 로컬 환경: .env에 적힌 경로를 바로 사용합니다.
        COOKIES_PATH = COOKIES_ENV
        print(f"=== [DEBUG] 로컬 파일 경로 기반 쿠키 지정 완료: {COOKIES_PATH} ===")
    else:
        # Render 배포 환경: 입력된 대용량 텍스트를 파일로 구워냅니다.
        TEMP_DIR = tempfile.gettempdir()
        COOKIES_PATH = os.path.join(TEMP_DIR, 'cookies.txt')
        with open(COOKIES_PATH, 'w', encoding='utf-8') as f:
            f.write(COOKIES_ENV.strip())
        print(f"=== [DEBUG] Render 환경변수 기반 임시 쿠키 파일 생성 완료 ===")
else:
    # 혹시나 env 설정을 깜빡했을 때의 최소한의 방어선 (기존 루트 경로)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    COOKIES_PATH = os.path.join(BASE_DIR, 'cookies.txt')

print(f"=== [DEBUG] COOKIES_PATH: {COOKIES_PATH} ===")
if os.path.exists(COOKIES_PATH):
    with open(COOKIES_PATH, 'r') as f:
        first_line = f.readline()
    print(f"=== [DEBUG] 쿠키 파일 발견됨! 첫 줄 내용: {first_line.strip()} ===")
else:
    print("❌ === [DEBUG] 에러: 루트 폴더에서 cookies.txt 파일을 찾을 수 없습니다! ===")

LANGUAGE_PRIORITY = ['ko', 'en']


def extract_video_id(url):
    if not url:
        return None

    pattern = (
        r'(?:https?:\/\/)?(?:www\.|m\.)?'
        r'(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)'
        r'([a-zA-Z0-9_-]{11})'
    )
    match = re.search(pattern, url)
    return match.group(1) if match else None


def format_duration(seconds):
    if not seconds:
        return '알 수 없음'

    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f'{hours}:{minutes:02d}:{secs:02d}'
    return f'{minutes}:{secs:02d}'


def fetch_youtube_metadata(video_id):
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'cookiefile': COOKIES_PATH,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
            return {
                'success': True,
                'title': info.get('title', '제목 없음'),
                'duration': format_duration(info.get('duration', 0)),
                'channel': info.get('channel', '채널명 없음'),
                'thumbnail': info.get('thumbnail', ''),
            }
    except Exception as exc:
        return {
            'success': False,
            'title': None,
            'duration': None,
            'channel': None,
            'error': f'메타데이터를 가져올 수 없습니다: {str(exc)}',
        }


def fetch_youtube_transcript(video_id):
    try:
        fallback_transcript = fetch_transcript_with_ytdlp(video_id)
        if fallback_transcript:
            return {
                'success': True,
                'data': fallback_transcript,
            }
    except Exception as exc:
        print(f"=== [DEBUG] yt-dlp 자막 추출 실패 원인: {str(exc)} ===")
        return {
            'success': False,
            'error': f'자막을 가져오는 중 오류가 발생했습니다: {str(exc)}',
        }

    try:
        transcript_list = get_transcript_for_installed_version(video_id, languages=LANGUAGE_PRIORITY)
        if transcript_list:
            return {
                'success': True,
                'data': transcript_list,
            }
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        pass
    except Exception:
        # youtube-transcript-api sometimes receives an empty XML response even
        # when YouTube shows captions. Try yt-dlp's caption URLs before failing.
        pass

    return {
        'success': False,
        'error': '이 영상에서 한국어 또는 영어 자막을 찾을 수 없습니다.',
    }


def get_transcript_for_installed_version(video_id, languages):
    if hasattr(YouTubeTranscriptApi, 'get_transcript'):
        return YouTubeTranscriptApi.get_transcript(video_id, languages=languages)

    fetched_transcript = YouTubeTranscriptApi().fetch(video_id, languages=languages)
    return normalize_transcript_data(fetched_transcript)


def normalize_transcript_data(transcript):
    if hasattr(transcript, 'to_raw_data'):
        return transcript.to_raw_data()

    normalized = []
    for item in transcript:
        if isinstance(item, dict):
            normalized.append(item)
            continue

        normalized.append({
            'text': getattr(item, 'text', ''),
            'start': getattr(item, 'start', 0),
            'duration': getattr(item, 'duration', 0),
        })
    return normalized


def fetch_transcript_with_ytdlp(video_id):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'cookiefile': COOKIES_PATH,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)

    caption = find_caption(info.get('subtitles') or {})
    if caption is None:
        caption = find_caption(info.get('automatic_captions') or {})

    if caption is None:
        return []

    payload = fetch_caption_payload(caption['url'])
    if caption.get('ext') == 'json3' or payload.lstrip().startswith('{'):
        return parse_json3_caption(payload)

    return parse_plain_caption(payload)


def find_caption(caption_groups):
    for language in LANGUAGE_PRIORITY:
        captions = caption_groups.get(language)
        caption = find_json3_caption(captions)
        if caption:
            return caption

    for language, captions in caption_groups.items():
        if any(language.startswith(priority) for priority in LANGUAGE_PRIORITY):
            caption = find_json3_caption(captions)
            if caption:
                return caption

    return None


def find_json3_caption(captions):
    if not captions:
        return None

    for caption in captions:
        if caption.get('ext') == 'json3':
            return caption

    return captions[0]


def fetch_caption_payload(url):
    request = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0'},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read().decode('utf-8', errors='replace')


def parse_json3_caption(payload):
    data = json.loads(payload)
    transcript = []

    for event in data.get('events', []):
        segments = event.get('segs') or []
        text = ''.join(segment.get('utf8', '') for segment in segments).strip()
        if not text:
            continue

        start_ms = event.get('tStartMs', 0)
        duration_ms = event.get('dDurationMs', 0)
        transcript.append({
            'text': re.sub(r'\s+', ' ', text),
            'start': start_ms / 1000,
            'duration': duration_ms / 1000,
        })

    return transcript


def parse_plain_caption(payload):
    lines = [
        line.strip()
        for line in payload.splitlines()
        if line.strip() and not line.startswith(('WEBVTT', 'Kind:', 'Language:'))
    ]

    transcript = []
    for line in lines:
        if '-->' in line or line.isdigit():
            continue
        transcript.append({
            'text': line,
            'start': 0,
            'duration': 0,
        })
    return transcript
