FROM node:22-alpine AS frontend
WORKDIR /src
COPY package.json package-lock.json vite.config.js ./
COPY frontend ./frontend
RUN npm ci && npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./backend/app
COPY --from=frontend /src/frontend/dist ./frontend/dist
RUN mkdir -p /data
ENV DATABASE_URL=sqlite:////data/marketing_analytics.db
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
