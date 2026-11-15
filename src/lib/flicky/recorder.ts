"use client";

// Microphone → 16 kHz mono WAV, the format /api/flicky/transcribe expects.
// Audio is tapped with an AudioWorklet (ScriptProcessor where worklets aren't
// available) and reports a 0–1 level for the waveform while recording.

const TARGET_RATE = 16_000;

const TAP_WORKLET = `
class FlickyTap extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.port.postMessage(channel.slice(0));
    return true;
  }
}
registerProcessor("flicky-tap", FlickyTap);
`;

export class MicError extends Error {
  constructor(
    message: string,
    readonly kind: "denied" | "missing" | "failed",
  ) {
    super(message);
  }
}

export interface Recording {
  /** Stops recording and returns the WAV plus its length in seconds. */
  stop(): Promise<{ wav: Blob; seconds: number }>;
  /** Stops recording and drops the audio. */
  cancel(): void;
}

function micError(error: unknown): MicError {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return new MicError("The microphone is blocked. Allow it in the address bar, or type your question instead.", "denied");
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return new MicError("No microphone found. Plug one in, or type your question instead.", "missing");
  }
  return new MicError("The microphone didn't start. Try again, or type your question instead.", "failed");
}

export async function startRecording(onLevel: (level: number) => void): Promise<Recording> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new MicError("This browser can't record audio. Type your question instead.", "missing");
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch (error) {
    throw micError(error);
  }

  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const chunks: Float32Array[] = [];
  const onChunk = (chunk: Float32Array) => {
    chunks.push(chunk);
    let sum = 0;
    for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
    onLevel(Math.min(1, Math.sqrt(sum / chunk.length) * 5));
  };

  let node: AudioNode;
  if (ctx.audioWorklet) {
    const url = URL.createObjectURL(new Blob([TAP_WORKLET], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    const tap = new AudioWorkletNode(ctx, "flicky-tap");
    tap.port.onmessage = (e: MessageEvent<Float32Array>) => onChunk(e.data);
    node = tap;
  } else {
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => onChunk(new Float32Array(e.inputBuffer.getChannelData(0)));
    node = processor;
  }
  // The tap has to reach the destination to keep running; a muted gain keeps it silent.
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(node);
  node.connect(mute);
  mute.connect(ctx.destination);

  const close = () => {
    stream.getTracks().forEach((t) => t.stop());
    source.disconnect();
    node.disconnect();
    void ctx.close();
  };

  return {
    async stop() {
      close();
      const length = chunks.reduce((n, c) => n + c.length, 0);
      const samples = new Float32Array(length);
      let offset = 0;
      for (const c of chunks) {
        samples.set(c, offset);
        offset += c.length;
      }
      return { wav: encodeWav(downsample(samples, ctx.sampleRate, TARGET_RATE), TARGET_RATE), seconds: length / ctx.sampleRate };
    },
    cancel: close,
  };
}

function downsample(samples: Float32Array, from: number, to: number): Float32Array {
  if (from <= to) return samples;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) => [...s].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
