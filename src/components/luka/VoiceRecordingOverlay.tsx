import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Pause, Play, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/wp-ui/button';

interface VoiceRecordingOverlayProps {
  open: boolean;
  onClose: () => void;
  onComplete: (text: string) => void;
}

/* Audio waveform visualizer — reads from AnalyserNode */
function WaveformVisualizer({ analyser, paused }: { analyser: AnalyserNode | null; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Gradient stroke
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "rgba(134, 73, 241, 0.8)");
      gradient.addColorStop(0.5, "rgba(53, 99, 186, 0.9)");
      gradient.addColorStop(1, "rgba(134, 73, 241, 0.8)");

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = paused ? "rgba(134, 73, 241, 0.3)" : gradient;
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Glow effect
      if (!paused) {
        ctx.shadowColor = "rgba(134, 73, 241, 0.4)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, paused]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full h-20 rounded-lg"
    />
  );
}

/* Floating dots animation for ambient effect */
function AmbientDots({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute w-1.5 h-1.5 rounded-full transition-opacity duration-500",
            active ? "opacity-60" : "opacity-0"
          )}
          style={{
            background: i % 2 === 0 ? "#8649F1" : "#2355A4",
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: active ? `float-dot-${i % 3} ${2 + i * 0.3}s ease-in-out infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* Timer display */
function RecordingTimer({ seconds, paused }: { seconds: number; paused: boolean }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className={cn(
      "text-sm font-mono tabular-nums transition-colors",
      paused ? "text-muted-foreground" : "text-foreground"
    )}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export function VoiceRecordingOverlay({ open, onClose, onComplete }: VoiceRecordingOverlayProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>(0);
  const accumulatedRef = useRef("");
  const handleStartRef = useRef<(() => void) | null>(null);

  // Clean up on close
  useEffect(() => {
    if (!open) {
      cleanup();
      setStatus("idle");
      setFinalText("");
      setInterimText("");
      setElapsed(0);
      setAnalyser(null);
    }
  }, [open]);

  // Auto-start recording when overlay opens
  useEffect(() => {
    if (open && status === "idle" && handleStartRef.current) {
      handleStartRef.current();
    }
  }, [open, status]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    accumulatedRef.current = "";
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        accumulatedRef.current += (accumulatedRef.current ? " " : "") + final.trim();
        setFinalText(accumulatedRef.current);
      }
      setInterimText(interim);
    };

    rec.onend = () => {
      // Auto-restart if still recording (browser stops after silence)
      if (recognitionRef.current && (status === "recording")) {
        try { rec.start(); } catch { /* already started */ }
      }
    };

    rec.onerror = (event: any) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
    };

    return rec;
  }, [status]);

  const handleStart = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio context for visualization
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.85;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // Speech recognition
      const rec = initRecognition();
      if (rec) {
        recognitionRef.current = rec;
        rec.start();
      }

      setStatus("recording");
      setElapsed(0);
      setFinalText("");
      setInterimText("");
      accumulatedRef.current = "";
      startTimer();
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }, [initRecognition, startTimer]);

  // Keep ref in sync for auto-start
  useEffect(() => { handleStartRef.current = handleStart; }, [handleStart]);

  const handlePause = useCallback(() => {
    setStatus("paused");
    stopTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [stopTimer]);

  const handleResume = useCallback(() => {
    setStatus("recording");
    startTimer();
    const rec = initRecognition();
    if (rec) {
      recognitionRef.current = rec;
      try { rec.start(); } catch { /* */ }
    }
  }, [initRecognition, startTimer]);

  const handleStop = useCallback(() => {
    setStatus("stopped");
    stopTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    // Keep analyser for frozen waveform effect
    setInterimText("");
  }, [stopTimer]);

  const handleDone = useCallback(() => {
    const text = finalText.trim();
    if (text) onComplete(text);
    onClose();
  }, [finalText, onComplete, onClose]);

  const handleCancel = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  if (!open) return null;

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isStopped = status === "stopped";
  const isIdle = status === "idle";

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-3 fade-in duration-300">
      <div className="mx-auto relative">
        <div className={cn(
          "rounded-xl border bg-background shadow-elevation-3 overflow-hidden transition-all duration-300",
          isRecording && "border-[#8649F1]/30 shadow-[0_0_30px_rgba(134,73,241,0.1)]"
        )}>
          <AmbientDots active={isRecording} />

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isRecording
                  ? "bg-gradient-to-br from-[#8649F1] to-[#2355A4] shadow-[0_0_16px_rgba(134,73,241,0.35)]"
                  : isPaused
                    ? "bg-gradient-to-br from-[#8649F1]/60 to-[#2355A4]/60"
                    : "bg-muted"
              )}>
                <Mic size={14} className="text-white" />
                {isRecording && (
                  <span className="absolute w-8 h-8 rounded-full bg-[#8649F1]/20 animate-ping" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {isIdle ? "Ready to record" : isRecording ? "Listening..." : isPaused ? "Paused" : "Recording complete"}
                </span>
                {!isIdle && <RecordingTimer seconds={elapsed} paused={isPaused || isStopped} />}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleCancel}>
              <X size={14} className="text-muted-foreground" />
            </Button>
          </div>

          {/* Waveform */}
          {!isIdle && (
            <div className="px-4 py-2 relative z-10">
              <WaveformVisualizer analyser={analyser} paused={!isRecording} />
            </div>
          )}

          {/* Live transcript */}
          <div className="px-4 pb-2 relative z-10 min-h-[40px]">
            {(finalText || interimText) ? (
              <div className="text-sm leading-relaxed">
                {finalText && <span className="text-foreground">{finalText}</span>}
                {interimText && (
                  <span className="text-muted-foreground/70 italic">
                    {finalText ? " " : ""}{interimText}
                  </span>
                )}
                {isRecording && (
                  <span className="inline-block w-0.5 h-3.5 bg-[#8649F1] ml-0.5 align-middle animate-pulse" />
                )}
              </div>
            ) : isIdle ? (
              <p className="text-sm text-muted-foreground">Click the button below to start recording</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Listening for speech...</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 px-4 pb-4 pt-1 relative z-10">
            {isIdle && (
              <button
                onClick={handleStart}
                className="h-12 w-12 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                <Mic size={20} />
              </button>
            )}

            {isRecording && (
              <>
                <button
                  onClick={handlePause}
                  className="h-10 w-10 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all active:scale-95"
                >
                  <Pause size={16} />
                </button>
                <button
                  onClick={handleStop}
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
                >
                  <Square size={16} fill="white" />
                </button>
              </>
            )}

            {isPaused && (
              <>
                <button
                  onClick={handleResume}
                  className="h-10 w-10 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all active:scale-95"
                >
                  <Play size={16} />
                </button>
                <button
                  onClick={handleStop}
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
                >
                  <Square size={16} fill="white" />
                </button>
              </>
            )}

            {isStopped && finalText && (
              <button
                onClick={handleDone}
                className="h-10 px-5 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] text-white text-sm font-medium shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                Use this text
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS for floating dots */}
      <style>{`
        @keyframes float-dot-0 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-dot-1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes float-dot-2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
