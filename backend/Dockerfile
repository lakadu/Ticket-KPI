# ---- Backend: FastAPI + Uvicorn ----
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps: curl for healthcheck, build tools for any source wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python deps first (better layer caching)
COPY requirements.docker.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# App source
COPY . .

# Do NOT ship any local .env inside the image; config comes from the environment
RUN rm -f .env

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://localhost:8001/api/health || exit 1

# 2 workers is a sane default for a small production box; adjust via override if needed
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
