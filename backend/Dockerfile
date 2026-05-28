FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Django 앱 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 마이그레이션 및 서버 실행
CMD ["gunicorn", "audiofit.wsgi:application", "--bind", "0.0.0.0:8000"]
