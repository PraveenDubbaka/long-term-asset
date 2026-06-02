import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Check, Loader2, MicOff, ShieldAlert, RefreshCw } from "lucide-react";

const FONT = "'DM Sans', system-ui, sans-serif";
const BLUE = "hsl(220 95% 50%)";
const BLUE_DEEP = "hsl(220 95% 42%)";
const VIOLET = "hsl(265 75% 55%)";
const BODY = "hsl(222 35% 16%)";
const SUBTLE = "hsl(222 15% 55%)";
const DANGER = "hsl(0 72% 50%)";

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (transcript: string) => void;
}

type Phase = "idle" | "requesting" | "denied" | "unsupported" | "listening";

const SAMPLE_TRANSCRIPT =
  "Can you change the engagement date to November fifteenth, twenty twenty five, and update the client name to Northwind Holdings. Also, please bold the fees section";

const Waveform = ({ active }: { active: boolean }) => (
  <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.div
        key={i}
        style={{
          width: 3,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${VIOLET}, ${BLUE})`,
        }}
        animate={
          active
            ? {
                height: [
                  6 + ((i * 7) % 18),
                  14 + ((i * 11) % 14),
                  6 + ((i * 5) % 20),
                ],
              }
            : { height: 6 }
        }
        transition={{
          duration: 0.7 + (i % 4) * 0.12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: (i * 0.04) % 0.3,
        }}
      />
    ))}
  </div>
);

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const TellLukaVoiceOverlay = ({ open, onClose, onSend }: Props) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [transcript, setTranscript] = useState(""); // committed final text
  const [partial, setPartial] = useState(""); // in-progress (interim) word
  const [edited, setEdited] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const clearTimers = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    timerRef.current = null;
    tickRef.current = null;
  };

  // Reset every time overlay opens / cleanup on close
  useEffect(() => {
    if (open) {
      setPhase("idle");
      setTranscript("");
      setPartial("");
      setEdited(false);
      setErrorMsg("");
      setElapsed(0);
    } else {
      clearTimers();
      stopMic();
    }
  }, [open]);

  useEffect(() => () => { clearTimers(); stopMic(); }, []);

  // Simulated live streaming — character ticks build a partial word, then commit
  useEffect(() => {
    if (phase !== "listening" || edited) return;
    const words = SAMPLE_TRANSCRIPT.split(" ");
    let wIdx = 0;
    let cIdx = 0;
    setPartial("");
    timerRef.current = window.setInterval(() => {
      if (wIdx >= words.length) {
        setPartial("");
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }
      const word = words[wIdx];
      cIdx += 1;
      if (cIdx >= word.length) {
        setTranscript((prev) => (prev ? prev + " " + word : word));
        setPartial("");
        wIdx += 1;
        cIdx = 0;
      } else {
        setPartial(word.slice(0, cIdx));
      }
    }, 55);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [phase, edited]);

  // Elapsed timer
  useEffect(() => {
    if (phase !== "listening") {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    setElapsed(0);
    const start = Date.now();
    tickRef.current = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      250
    );
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [phase]);

  // Track user caret + scroll inside the textarea so streaming updates don't disturb them
  const caretRef = useRef<{ start: number; end: number; scroll: number } | null>(null);
  const saveCaret = () => {
    const el = textareaRef.current;
    if (!el) return;
    caretRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
      scroll: el.scrollTop,
    };
  };

  const NEAR_BOTTOM_PX = 16;
  const wasLiveAtBottomRef = useRef(true);
  const wasTextAtBottomRef = useRef(true);
  // Capture "was at bottom" BEFORE DOM is updated with the new text
  useLayoutEffect(() => {
    const live = liveScrollRef.current;
    if (live) {
      wasLiveAtBottomRef.current =
        live.scrollHeight - live.scrollTop - live.clientHeight <= NEAR_BOTTOM_PX;
    }
    const ta = textareaRef.current;
    if (ta) {
      wasTextAtBottomRef.current =
        ta.scrollHeight - ta.scrollTop - ta.clientHeight <= NEAR_BOTTOM_PX;
    }
  });

  // After DOM update: restore caret/scroll for the textarea, and only autoscroll
  // when the user was already pinned to the bottom.
  useLayoutEffect(() => {
    const live = liveScrollRef.current;
    if (live && wasLiveAtBottomRef.current) {
      live.scrollTop = live.scrollHeight;
    }
    const ta = textareaRef.current;
    if (!ta) return;
    const isFocused = document.activeElement === ta;
    if (isFocused && caretRef.current) {
      // Clamp to current value length in case streaming changed length
      const len = ta.value.length;
      const start = Math.min(caretRef.current.start, len);
      const end = Math.min(caretRef.current.end, len);
      try {
        ta.setSelectionRange(start, end);
      } catch {
        /* noop */
      }
      ta.scrollTop = caretRef.current.scroll;
    } else if (!edited && wasTextAtBottomRef.current) {
      ta.scrollTop = ta.scrollHeight;
    }
  }, [transcript, partial, edited]);


  const requestMic = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMsg(
        "Your browser doesn't support microphone access. Try Chrome, Edge, Safari, or Firefox on a secure (https) connection."
      );
      setPhase("unsupported");
      return;
    }
    setPhase("requesting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPhase("listening");
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      let msg = "We couldn't access your microphone. Please try again.";
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        msg =
          "Microphone access was blocked. Click the lock icon in your browser's address bar and allow microphone access, then try again.";
      } else if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") {
        msg = "No microphone was found. Please connect a mic and try again.";
      } else if (e?.name === "NotReadableError") {
        msg = "Your microphone is being used by another app. Close it and try again.";
      } else if (e?.message) {
        msg = e.message;
      }
      setErrorMsg(msg);
      setPhase("denied");
    }
  };

  const handleRerecord = () => {
    setTranscript("");
    setPartial("");
    setEdited(false);
    setElapsed(0);
    setPhase("idle");
    requestMic();
  };

  const handleSend = () => {
    if (!transcript.trim()) return;
    stopMic();
    onSend(transcript.trim());
  };

  const handleClose = () => {
    stopMic();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-50"
          style={{
            background: "hsl(220 30% 96% / 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            fontFamily: FONT,
          }}
        >
          {/* Cancel top-right */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(220_20%_96%)]"
            style={{
              border: "1px solid hsl(220 20% 60%)",
              background: "white",
              color: BODY,
              boxShadow: "0 2px 8px hsl(220 30% 30% / 0.06)",
            }}
          >
            Cancel
          </button>

          {/* Phase content */}
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.button
                key="idle"
                onClick={requestMic}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 168,
                  height: 168,
                  borderRadius: "50%",
                  background: "white",
                  border: "1px solid hsl(220 20% 88%)",
                  boxShadow:
                    "0 20px 60px hsl(220 40% 22% / 0.18), 0 4px 16px hsl(220 40% 22% / 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <motion.div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: "50%",
                    border: `2px solid ${VIOLET}`,
                    opacity: 0.35,
                  }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.08, 0.35] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <Mic size={32} strokeWidth={2} style={{ color: VIOLET }} />
                <div
                  className="text-[14px] italic text-center leading-tight px-4"
                  style={{ color: "hsl(222 25% 35%)", fontWeight: 500 }}
                >
                  Click here to
                  <br />
                  start speaking
                </div>
              </motion.button>
            )}

            {phase === "requesting" && (
              <motion.div
                key="requesting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute"
                role="status"
                aria-live="polite"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 320,
                  background: "white",
                  border: "1px solid hsl(220 20% 88%)",
                  borderRadius: 18,
                  padding: "26px 22px",
                  boxShadow: "0 20px 60px hsl(220 40% 22% / 0.18)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: "0 auto 14px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, hsl(265 75% 92%), hsl(220 95% 92%))",
                    border: "1px solid hsl(220 60% 85%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2
                    size={26}
                    style={{ color: BLUE }}
                    className="animate-spin"
                  />
                </div>
                <div
                  className="text-[15px] font-bold mb-1"
                  style={{ color: "hsl(215 75% 18%)" }}
                >
                  Requesting microphone…
                </div>
                <div className="text-[12.5px]" style={{ color: SUBTLE }}>
                  Allow access in the browser prompt to start speaking with Luka.
                </div>
              </motion.div>
            )}

            {(phase === "denied" || phase === "unsupported") && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute"
                role="alert"
                aria-live="assertive"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 380,
                  background: "white",
                  border: `1px solid ${DANGER}`,
                  borderRadius: 18,
                  padding: "24px 22px 20px",
                  boxShadow: "0 20px 60px hsl(0 60% 30% / 0.18)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: "0 auto 14px",
                    borderRadius: "50%",
                    background: "hsl(0 80% 96%)",
                    border: "1px solid hsl(0 70% 88%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {phase === "denied" ? (
                    <MicOff size={26} style={{ color: DANGER }} />
                  ) : (
                    <ShieldAlert size={26} style={{ color: DANGER }} />
                  )}
                </div>
                <div
                  className="text-[15px] font-bold mb-1.5"
                  style={{ color: "hsl(215 75% 18%)" }}
                >
                  {phase === "denied"
                    ? "Microphone access needed"
                    : "Microphone not supported"}
                </div>
                <div
                  className="text-[12.5px] leading-relaxed mb-4"
                  style={{ color: SUBTLE }}
                >
                  {errorMsg}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(220_20%_96%)]"
                    style={{
                      border: "1px solid hsl(220 20% 60%)",
                      background: "white",
                      color: BODY,
                    }}
                  >
                    Close
                  </button>
                  {phase === "denied" && (
                    <button
                      onClick={requestMic}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all"
                      style={{
                        border: `1px solid ${BLUE_DEEP}`,
                        background: BLUE,
                        boxShadow: "0 4px 12px hsl(220 95% 50% / 0.25)",
                      }}
                    >
                      <RefreshCw size={13} strokeWidth={2.6} />
                      Try again
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {phase === "listening" && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 right-0 bottom-0"
                style={{
                  background: "white",
                  borderTop: `2px solid ${BLUE}`,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  padding: "18px 22px 20px",
                  boxShadow: "0 -10px 32px hsl(220 40% 22% / 0.12)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <motion.div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, hsl(265 75% 85%), hsl(220 95% 85%))",
                        border: "1px solid hsl(265 50% 75%)",
                      }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="min-w-0">
                      <div
                        className="flex items-center gap-2 text-[14px] font-bold"
                        style={{ color: "hsl(215 75% 18%)" }}
                      >
                        Luka is listening
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: "hsl(0 80% 96%)",
                            color: DANGER,
                            border: "1px solid hsl(0 70% 88%)",
                          }}
                        >
                          <motion.span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: DANGER,
                              display: "inline-block",
                            }}
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          Live
                        </span>
                      </div>
                      <div className="text-[12px]" style={{ color: SUBTLE }}>
                        {edited
                          ? "You're editing — live transcription paused"
                          : "Speak naturally — words appear as you go"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className="text-[11.5px] font-semibold tabular-nums"
                      style={{ color: SUBTLE }}
                    >
                      {formatTime(elapsed)} ·{" "}
                      {transcript ? transcript.trim().split(/\s+/).length : 0} words
                    </div>
                    <Waveform active={!edited} />
                  </div>
                </div>

                {/* Live streaming preview (read-only while streaming) */}
                {!edited && (
                  <div
                    ref={liveScrollRef}
                    aria-live="polite"
                    className="w-full text-[14px] leading-relaxed px-3.5 py-3 mb-2 overflow-y-auto"
                    style={{
                      maxHeight: 110,
                      minHeight: 64,
                      border: `1px dashed hsl(220 70% 80%)`,
                      borderRadius: 12,
                      background:
                        "linear-gradient(180deg, hsl(220 95% 98%), hsl(265 75% 98%))",
                      color: BODY,
                      fontFamily: FONT,
                    }}
                  >
                    {transcript || partial ? (
                      <>
                        <span>{transcript}</span>
                        {partial && (
                          <>
                            {transcript ? " " : ""}
                            <span style={{ color: VIOLET, fontStyle: "italic" }}>
                              {partial}
                            </span>
                          </>
                        )}
                        <motion.span
                          aria-hidden
                          style={{
                            display: "inline-block",
                            width: 2,
                            height: "1em",
                            background: BLUE,
                            marginLeft: 2,
                            verticalAlign: "text-bottom",
                          }}
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity }}
                        />
                      </>
                    ) : (
                      <span style={{ color: SUBTLE, fontStyle: "italic" }}>
                        Listening for your voice…
                      </span>
                    )}
                  </div>
                )}

                {/* Editable transcript — click to fine-tune */}
                <textarea
                  ref={textareaRef}
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setEdited(true);
                    // After user edits, treat their caret/scroll as the source of truth
                    requestAnimationFrame(saveCaret);
                  }}
                  onSelect={saveCaret}
                  onKeyUp={saveCaret}
                  onClick={saveCaret}
                  onScroll={() => {
                    const el = textareaRef.current;
                    if (!el) return;
                    if (caretRef.current) caretRef.current.scroll = el.scrollTop;
                    else
                      caretRef.current = {
                        start: el.selectionStart ?? 0,
                        end: el.selectionEnd ?? 0,
                        scroll: el.scrollTop,
                      };
                  }}
                  onBlur={() => {
                    caretRef.current = null;
                  }}
                  placeholder="Your words will appear here — tap to edit anytime…"
                  rows={edited ? 4 : 2}
                  className="w-full text-[14px] leading-relaxed px-3.5 py-3 outline-none resize-none transition-colors focus:border-[hsl(220_95%_50%)]"
                  style={{
                    border: `1.5px solid ${edited ? BLUE : "hsl(220 20% 88%)"}`,
                    borderRadius: 12,
                    fontFamily: FONT,
                    color: BODY,
                    background: edited ? "white" : "hsl(220 25% 99%)",
                  }}
                />


                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={handleRerecord}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(220_20%_96%)]"
                    style={{
                      border: "1px solid hsl(220 20% 60%)",
                      background: "white",
                      color: BODY,
                    }}
                  >
                    <Mic size={13} strokeWidth={2.4} />
                    Re-record
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!transcript.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
                    style={{
                      border: `1px solid ${transcript.trim() ? BLUE_DEEP : "hsl(220 20% 85%)"}`,
                      background: transcript.trim() ? BLUE : "hsl(220 20% 92%)",
                      color: transcript.trim() ? "white" : "hsl(220 15% 60%)",
                      cursor: transcript.trim() ? "pointer" : "not-allowed",
                      boxShadow: transcript.trim()
                        ? "0 4px 12px hsl(220 95% 50% / 0.25)"
                        : "none",
                    }}
                  >
                    <Check size={13} strokeWidth={2.6} />
                    Send to Luka
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TellLukaVoiceOverlay;
