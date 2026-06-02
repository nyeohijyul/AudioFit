# node:18-alpine에서 node:22-alpine으로 변경
FROM node:22-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 앱 복사
COPY . .

# 포트 노출
EXPOSE 5173

# 개발 서버 실행
CMD ["npm", "run", "dev"]