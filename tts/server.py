"""1ry-space tts: Kokoro-82M (Apache 2.0) text-to-speech for Flicky's voice.

Internal service, only the app reaches it:
  POST /speak  {"text": "...", "voice": "af_heart"}  -> audio/wav (16-bit mono)
  GET  /health -> {"ok": true, "voices": [...]}
"""

import io
import json
import os
import threading
import time
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
from kokoro_onnx import Kokoro

MODEL = os.environ.get("KOKORO_MODEL", "/models/kokoro-v1.0.int8.onnx")
VOICES = os.environ.get("KOKORO_VOICES", "/models/voices-v1.0.bin")
PORT = int(os.environ.get("PORT", "8880"))
MAX_CHARS = 1500
DEFAULT_VOICE = "af_heart"
ALLOWED_VOICES = {"af_heart", "af_bella", "af_sarah", "am_michael", "am_adam", "bf_emma", "bm_george"}

kokoro = Kokoro(MODEL, VOICES)
# One synthesis at a time: it uses every CPU core it gets.
lock = threading.Lock()


def to_wav(samples: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    def _json(self, status: int, obj: dict) -> None:
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            return self._json(200, {"ok": True, "voices": sorted(ALLOWED_VOICES)})
        self._json(404, {"error": "Not found."})

    def do_POST(self):
        if self.path != "/speak":
            return self._json(404, {"error": "Not found."})
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 16_000:
            return self._json(400, {"error": "Send a JSON body under 16 KB."})
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            return self._json(400, {"error": "Body must be JSON."})
        text = str(body.get("text", "")).strip()
        voice = body.get("voice") or DEFAULT_VOICE
        if not text or len(text) > MAX_CHARS:
            return self._json(400, {"error": f"text must be 1-{MAX_CHARS} characters."})
        if voice not in ALLOWED_VOICES:
            return self._json(400, {"error": f"Unknown voice. Use one of: {', '.join(sorted(ALLOWED_VOICES))}."})
        started = time.time()
        with lock:
            samples, rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
        wav = to_wav(samples, rate)
        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(wav)))
        self.send_header("X-Synthesis-Ms", str(int((time.time() - started) * 1000)))
        self.end_headers()
        self.wfile.write(wav)

    def log_message(self, fmt, *args):  # one short line per request
        print(f"[tts] {self.address_string()} {fmt % args}", flush=True)


if __name__ == "__main__":
    print(f"[tts] Kokoro loaded ({os.path.basename(MODEL)}), listening on {PORT}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
