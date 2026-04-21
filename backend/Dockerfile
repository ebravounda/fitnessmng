FROM python:3.11-slim

WORKDIR /app

COPY requirements-prod.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV MONGO_URL=mongodb://172.17.0.1:27017
ENV DB_NAME=gym24
ENV CORS_ORIGINS=https://gym24.app,https://www.gym24.app

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
