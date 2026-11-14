# syntax=docker/dockerfile:1
# Kokoro-82M (Apache 2.0) via kokoro-onnx with the 88 MB int8 model.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN pip install kokoro-onnx==0.6.1 && pip freeze > /requirements.lock
ADD https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx /models/kokoro-v1.0.int8.onnx
ADD https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin /models/voices-v1.0.bin
RUN chmod 644 /models/* && useradd --system --uid 10001 tts
COPY server.py /app/server.py
USER tts
EXPOSE 8880
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8880/health', timeout=2)"
CMD ["python", "/app/server.py"]
