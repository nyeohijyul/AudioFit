import json

from decouple import config
from openai import OpenAI


NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
NVIDIA_MODEL = 'mistralai/mistral-nemotron'


def simplify_subtitles(subtitles):
    api_key = config('NVIDIA_API_KEY', default='')
    if not api_key:
        return {
            'success': False,
            'error': '서버에 NVIDIA_API_KEY가 설정되어 있지 않습니다.',
        }

    try:
        client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=api_key)
        completion = client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=[
                {
                    'role': 'system',
                    'content': (
                        '너는 한국어 운동 영상 자막을 초보자가 이해하기 쉬운 말로 바꾸는 편집자다. '
                        '입력 순서와 개수를 유지하고, 반드시 JSON만 반환한다.'
                    ),
                },
                {
                    'role': 'user',
                    'content': build_simplify_prompt(subtitles),
                },
            ],
            temperature=0.4,
            top_p=0.7,
            max_tokens=4096,
            stream=False,
        )
    except Exception as exc:
        return {
            'success': False,
            'error': f'AI 요청에 실패했습니다: {str(exc)}',
        }

    content = completion.choices[0].message.content or ''
    try:
        simplified = json.loads(extract_json(content))
    except json.JSONDecodeError:
        return {
            'success': False,
            'error': 'AI 응답을 JSON으로 해석하지 못했습니다.',
        }

    if not isinstance(simplified, list):
        return {
            'success': False,
            'error': 'AI 응답은 JSON 배열이어야 합니다.',
        }

    return {
        'success': True,
        'data': merge_simplified_subtitles(subtitles, simplified),
    }


def build_simplify_prompt(subtitles):
    compact_subtitles = [
        {
            'index': idx,
            'time': subtitle.get('time', ''),
            'tag': subtitle.get('tag', ''),
            'text': subtitle.get('original') or subtitle.get('text') or subtitle.get('translated') or '',
        }
        for idx, subtitle in enumerate(subtitles)
    ]

    return (
        '아래 자막을 운동 초보자가 바로 이해할 수 있는 쉬운 한국어로 바꿔 주세요.\n'
        '조건:\n'
        '- 입력과 같은 개수, 같은 index 순서로 반환\n'
        '- 의미는 유지하되 전문 용어는 쉽게 풀어 쓰기\n'
        '- 광고, 구독 유도, 잡담처럼 운동 루틴과 무관한 문장은 짧게 정리\n'
        '- JSON 배열만 반환\n'
        '- 각 항목 형식: {"index": number, "translated": "쉬운 한국어 문장"}\n\n'
        f'자막:\n{json.dumps(compact_subtitles, ensure_ascii=False)}'
    )


def extract_json(content):
    stripped = content.strip()
    if stripped.startswith('```'):
        stripped = stripped.strip('`')
        if stripped.startswith('json'):
            stripped = stripped[4:].strip()

    start = stripped.find('[')
    end = stripped.rfind(']')
    if start != -1 and end != -1:
        return stripped[start:end + 1]
    return stripped


def merge_simplified_subtitles(original_subtitles, simplified_subtitles):
    simplified_by_index = {
        item.get('index'): item.get('translated', '')
        for item in simplified_subtitles
        if isinstance(item, dict)
    }

    merged = []
    for idx, subtitle in enumerate(original_subtitles):
        next_subtitle = dict(subtitle)
        simplified_text = simplified_by_index.get(idx)
        if simplified_text:
            next_subtitle['translated'] = simplified_text
        merged.append(next_subtitle)
    return merged
