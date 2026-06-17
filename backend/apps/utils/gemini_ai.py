import json

from pathlib import Path
from decouple import Config, RepositoryEnv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    config = Config(RepositoryEnv(env_path))
else:
    from decouple import config

from openai import OpenAI


GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
GEMINI_MODEL = 'gemini-2.5-flash'


def simplify_subtitles(subtitles):
    api_key = config('GEMINI_API_KEY', default='')
    if not api_key:
        return {
            'success': False,
            'error': '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다.',
        }

    # Chunk subtitles to avoid Gemini output truncation (max_tokens limit)
    CHUNK_SIZE = 25
    all_simplified = []

    if not subtitles:
        return {
            'success': True,
            'data': [],
        }

    try:
        client = OpenAI(base_url=GEMINI_BASE_URL, api_key=api_key)
    except Exception as exc:
        return {
            'success': False,
            'error': f'OpenAI 클라이언트 초기화 실패: {str(exc)}',
        }

    for i in range(0, len(subtitles), CHUNK_SIZE):
        chunk = subtitles[i:i + CHUNK_SIZE]
        try:
            completion = client.chat.completions.create(
                model=GEMINI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        'role': 'system',
                        'content': (
                            '너는 한국어 운동 영상 자막을 초보자가 이해하기 쉬운 말로 바꾸는 편집자다. '
                            '반드시 {"subtitles": [...]} 형태의 JSON 객체로 반환한다.'
                        ),
                    },
                    {
                        'role': 'user',
                        'content': build_simplify_prompt(chunk),
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
                'error': f'AI 요청 실패 (진행도 {i}/{len(subtitles)}): {str(exc)}',
            }

        content = completion.choices[0].message.content or ''
        chunk_simplified = []
        try:
            data = json.loads(content)
            chunk_simplified = data.get('subtitles', [])
        except (json.JSONDecodeError, KeyError, TypeError):
            try:
                parsed = json.loads(extract_json(content))
                if isinstance(parsed, dict):
                    chunk_simplified = parsed.get('subtitles', [])
                elif isinstance(parsed, list):
                    chunk_simplified = parsed
                else:
                    raise ValueError()
            except Exception as e:
                return {
                    'success': False,
                    'error': f'AI 응답을 JSON으로 해석하지 못했습니다. (오류: {str(e)}, 응답내용: {content[:150]}...)',
                }

        if not isinstance(chunk_simplified, list):
            return {
                'success': False,
                'error': f'AI 응답의 subtitles 형식이 올바르지 않습니다. (응답내용: {content[:150]}...)',
            }

        # Map indices back to original positions
        for idx, item in enumerate(chunk_simplified):
            if isinstance(item, dict) and 'index' in item:
                try:
                    rel_idx = int(item['index'])
                    item['index'] = i + rel_idx
                except (ValueError, TypeError):
                    item['index'] = i + idx
            elif isinstance(item, dict):
                item['index'] = i + idx

        all_simplified.extend(chunk_simplified)

    return {
        'success': True,
        'data': merge_simplified_subtitles(subtitles, all_simplified),
    }


def recommend_exercise_notes(exercises, answers):
    api_key = config('GEMINI_API_KEY', default='')
    if not api_key:
        return {
            'success': False,
            'error': '',
        }

    compact_exercises = [
        {
            'id': exercise.get('id'),
            'name': exercise.get('name'),
            'ko_name': exercise.get('ko_name'),
            'body_part': exercise.get('body_part'),
            'target': exercise.get('target'),
            'description': exercise.get('description'),
        }
        for exercise in exercises
    ]

    try:
        client = OpenAI(base_url=GEMINI_BASE_URL, api_key=api_key)
        completion = client.chat.completions.create(
            model=GEMINI_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {
                    'role': 'system',
                    'content': (
                        '너는 한국어 홈트레이닝 코치다. ExerciseDB 운동 데이터를 앱 화면에 표시할 '
                        '짧고 쉬운 한국어 이름과 설명으로 다듬는다. 반드시 {"notes": [...]} 형태의 JSON 객체로 반환한다.'
                    ),
                },
                {
                    'role': 'user',
                    'content': build_recommendation_prompt(compact_exercises, answers),
                },
            ],
            temperature=0.35,
            top_p=0.75,
            max_tokens=2048,
            stream=False,
        )
    except Exception as exc:
        return {
            'success': False,
            'error': f'Gemini 추천 설명 보강에 실패했습니다: {str(exc)}',
        }

    content = completion.choices[0].message.content or ''
    notes = []
    try:
        data = json.loads(content)
        notes = data.get('notes', [])
    except (json.JSONDecodeError, KeyError, TypeError):
        try:
            parsed = json.loads(extract_json(content))
            if isinstance(parsed, dict):
                notes = parsed.get('notes', [])
            elif isinstance(parsed, list):
                notes = parsed
            else:
                raise ValueError()
        except Exception as e:
            return {
                'success': False,
                'error': f'Gemini 추천 설명 응답을 JSON으로 해석하지 못했습니다. (오류: {str(e)}, 응답내용: {content[:150]}...)',
            }

    if not isinstance(notes, list):
        return {
            'success': False,
            'error': f'Gemini 추천 설명 응답의 notes는 배열이어야 합니다. (응답내용: {content[:150]}...)',
        }

    return {
        'success': True,
        'data': notes,
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
        '- 반드시 {"subtitles": [...]} 형태의 JSON 객체로 반환하세요.\n'
        '- 각 항목 형식: {"index": number, "translated": "쉬운 한국어 문장", "exercise": "동작명", "duration_sec": number}\n'
        '- "exercise" 필드에는 해당 자막이 설명하고 있는 구체적인 운동 동작의 이름(예: 스쿼트, 런지, 푸시업, 스트레칭 등)을 한국어로 작성하세요. 만약 인트로, 잡담, 아웃트로 등 특정 운동 동작에 해당하지 않는 자막인 경우 "준비/기타"로 분류하세요.\n'
        '- 절대 본래 영상/자막의 실제 운동 종류와 관련 없는 엉뚱한 운동(예: 상체/하체/스트레칭 영상인데 복근 운동이나 스쿼트로 작성)으로 임의 왜곡하여 지목하지 마십시오. 반드시 원본 자막에서 설명하고 진행 중인 운동 동작에 맞게 지목해야 합니다.\n'
        '- "duration_sec" 필드에는 다음을 계산한 총 시간(초)을 입력하세요:\n'
        '  * 자막 설명 시간: 해당 자막이 화면에 표시되는 시간\n'
        '  * 동작 시행 시간: 자막 내용에 명시된 동작 수행 시간(예: "5초 동안", "30초", "1분 반복")\n'
        '  * 예시 1) 자막: "30초 동안 스쿼트 하세요" (자막 2초 표시) → duration_sec: 32\n'
        '  * 예시 2) 자막: "준비" (자막 1초 표시, 동작 시간 없음) → duration_sec: 1\n'
        '  * 만약 자막에 시간이 명시되지 않으면 자막 표시 시간만 사용\n\n'
        f'자막:\n{json.dumps(compact_subtitles, ensure_ascii=False)}'
    )


def build_recommendation_prompt(exercises, answers):
    return (
        '아래 ExerciseDB 운동 후보를 홈트 사용자에게 보여줄 문구로 다듬어 주세요.\n'
        '조건:\n'
        '- 반드시 {"notes": [...]} 형태의 JSON 객체로 반환하세요.\n'
        '- 입력된 id를 그대로 유지\n'
        '- 각 항목 형식: {"id": "string", "ko_name": "한국어 운동명", "description": "40자 안팎의 쉬운 운동 설명"}\n'
        '- 홈트레이닝/맨몸 운동 맥락으로 작성\n'
        '- 무리한 의학적 조언이나 치료 표현은 피하기\n\n'
        f'사용자 조건:\n{json.dumps(answers, ensure_ascii=False)}\n\n'
        f'운동 후보:\n{json.dumps(exercises, ensure_ascii=False)}'
    )


def extract_json(content):
    stripped = content.strip()
    
    # Remove markdown code block if present
    if '```' in stripped:
        parts = stripped.split('```')
        for part in parts:
            part = part.strip()
            if part.startswith('json'):
                part = part[4:].strip()
            
            # Check brackets start first
            s_brace = part.find('{')
            s_bracket = part.find('[')
            if s_brace != -1 and (s_bracket == -1 or s_brace < s_bracket):
                e_brace = part.rfind('}')
                if e_brace != -1:
                    return part[s_brace:e_brace + 1]
            elif s_bracket != -1:
                e_bracket = part.rfind(']')
                if e_bracket != -1:
                    return part[s_bracket:e_bracket + 1]

    # Fallback to finding brackets in the raw string
    s_brace = stripped.find('{')
    s_bracket = stripped.find('[')
    if s_brace != -1 and (s_bracket == -1 or s_brace < s_bracket):
        e_brace = stripped.rfind('}')
        if e_brace != -1:
            return stripped[s_brace:e_brace + 1]
    elif s_bracket != -1:
        e_bracket = stripped.rfind(']')
        if e_bracket != -1:
            return stripped[s_bracket:e_bracket + 1]
        
    return stripped


def merge_simplified_subtitles(original_subtitles, simplified_subtitles):
    simplified_by_index = {
        item.get('index'): (
            item.get('translated', ''),
            item.get('exercise', '준비/기타'),
            item.get('duration_sec', 0)
        )
        for item in simplified_subtitles
        if isinstance(item, dict)
    }

    merged = []
    for idx, subtitle in enumerate(original_subtitles):
        next_subtitle = dict(subtitle)
        info = simplified_by_index.get(idx)
        if info:
            next_subtitle['translated'] = info[0]
            next_subtitle['exercise'] = info[1]
            next_subtitle['duration_sec'] = info[2]
        else:
            next_subtitle['exercise'] = next_subtitle.get('exercise', '준비/기타')
            next_subtitle['duration_sec'] = next_subtitle.get('duration_sec', 0)
        merged.append(next_subtitle)
    return merged

