import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "./CommentContext";
import type { CommentUser, CommentAttachment, CommentVoiceNote } from "./types";
import { Paperclip, Mic, Send, X, AtSign, Image as ImageIcon, FileText, File as FileIcon, Square, Play, Pause } from "lucide-react";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface CommentPrompterProps {
  onSubmit: (body: string, mentions: string[], attachments: CommentAttachment[], voiceNote?: CommentVoiceNote) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

const formatTimer = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(1, "0");
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
};

const fileIcon = (type: string) => {
  if (type.startsWith("image/")) return <ImageIcon size={11} />;
  if (type.includes("pdf") || type.includes("doc")) return <FileText size={11} />;
  return <FileIcon size={11} />;
};

const CommentPrompter = ({ onSubmit, onCancel, placeholder = "Write a comment…", autoFocus = true, compact = false }: CommentPrompterProps) => {
  const { members, currentUser } = useComments();
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceNote, setVoiceNote] = useState<CommentVoiceNote | null>(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) window.clearInterval(recordIntervalRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    setRecording(true);
    setRecordSeconds(0);
    recordIntervalRef.current = window.setInterval(() => {
      setRecordSeconds(prev => prev + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordIntervalRef.current) window.clearInterval(recordIntervalRef.current);
    setRecording(false);
    if (recordSeconds > 0) {
      setVoiceNote({
        id: `vn-${Date.now()}`,
        durationSec: recordSeconds,
      });
    }
  }, [recordSeconds]);

  const cancelRecording = useCallback(() => {
    if (recordIntervalRef.current) window.clearInterval(recordIntervalRef.current);
    setRecording(false);
    setRecordSeconds(0);
  }, []);

  const removeVoiceNote = useCallback(() => {
    setVoiceNote(null);
    setVoicePlaying(false);
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list: AttachedFile[] = Array.from(files).map(file => {
      const att: AttachedFile = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      };
      if (file.type.startsWith("image/")) {
        att.preview = URL.createObjectURL(file);
      }
      return att;
    });
    setAttachments(prev => [...prev, ...list]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const filteredMembers = members
    .filter(m => m.id !== currentUser.id)
    .filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()));

  const handleInput = (val: string) => {
    setBody(val);
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === " ")) {
      const query = val.slice(lastAt + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: CommentUser) => {
    const lastAt = body.lastIndexOf("@");
    const before = body.slice(0, lastAt);
    const after = body.slice(lastAt + 1 + mentionQuery.length);
    setBody(`${before}@${member.name}${after} `);
    setMentions(prev => [...new Set([...prev, member.id])]);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const hasContent = body.trim().length > 0 || attachments.length > 0 || !!voiceNote;

  const handleSubmit = () => {
    if (!hasContent) return;
    const atts: CommentAttachment[] = attachments.map(a => ({
      id: a.id, name: a.name, type: a.type, size: a.size, url: a.preview || "#",
    }));
    onSubmit(body.trim(), mentions, atts, voiceNote || undefined);
    setBody(""); setMentions([]); setAttachments(prev => {
      prev.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); });
      return [];
    });
    setVoiceNote(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && onCancel) onCancel();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Mention dropdown */}
      <AnimatePresence>
        {showMentions && filteredMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 right-0 z-50 rounded-lg overflow-hidden"
            style={{
              bottom: "100%",
              marginBottom: 6,
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(220 15% 88%)",
              boxShadow: "0 8px 24px hsl(220 20% 10% / 0.12)",
            }}
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(220 15% 55%)" }}>
              Mention a teammate
            </div>
            {filteredMembers.slice(0, 5).map(m => (
              <button
                key={m.id}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer hover:bg-[hsl(220_15%_96%)]"
                style={{ color: "hsl(220 20% 15%)" }}
                onClick={() => insertMention(m)}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: m.avatarColor }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-[11px] capitalize" style={{ color: "hsl(220 15% 55%)" }}>{m.role}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "hsl(0 0% 100%)",
          borderColor: body || hasContent ? "hsl(270 60% 70%)" : "hsl(220 15% 88%)",
          boxShadow: hasContent ? "0 4px 16px hsl(270 60% 55% / 0.08)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {recording ? (
          <div className="flex items-center gap-3 px-3 py-3">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "hsl(0 72% 55%)" }}
            />
            <span className="text-[13px] font-mono font-semibold" style={{ color: "hsl(0 72% 45%)" }}>
              {formatTimer(recordSeconds)}
            </span>
            <span className="text-[12px] flex-1" style={{ color: "hsl(220 15% 50%)" }}>
              Recording voice note…
            </span>
            <button
              onClick={cancelRecording}
              className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: "hsl(220 15% 95%)", color: "hsl(220 15% 50%)" }}
              title="Cancel"
            >
              <X size={13} />
            </button>
            <button
              onClick={stopRecording}
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: "hsl(270 60% 55%)", color: "white" }}
              title="Stop & attach"
            >
              <Square size={12} fill="white" />
            </button>
          </div>
        ) : (
          <>
            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={compact ? 1 : 2}
              className="w-full resize-none border-none outline-none bg-transparent px-3.5 pt-2.5 pb-1 text-[13px]"
              style={{ color: "hsl(220 20% 15%)", minHeight: compact ? 36 : 44 }}
            />

            {/* Voice note preview */}
            {voiceNote && (
              <div className="mx-3 mb-2 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: "hsl(270 60% 96%)", border: "1px solid hsl(270 60% 88%)" }}>
                <button
                  onClick={() => setVoicePlaying(p => !p)}
                  className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
                  style={{ background: "hsl(270 60% 55%)", color: "white" }}
                >
                  {voicePlaying ? <Pause size={11} fill="white" /> : <Play size={11} fill="white" />}
                </button>
                <div className="flex-1 flex items-center gap-[2px]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full flex-1"
                      style={{
                        height: 4 + Math.abs(Math.sin(i * 0.7)) * 14,
                        background: "hsl(270 60% 60%)",
                        opacity: voicePlaying ? 1 : 0.55,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono font-semibold flex-shrink-0" style={{ color: "hsl(270 60% 40%)" }}>
                  {formatTimer(voiceNote.durationSec)}
                </span>
                <button
                  onClick={removeVoiceNote}
                  className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
                  style={{ background: "hsl(0 70% 55%)", color: "white" }}
                >
                  <X size={9} />
                </button>
              </div>
            )}

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="group flex items-center gap-1.5 px-2 py-1 rounded-lg"
                    style={{ background: "hsl(220 15% 96%)", border: "1px solid hsl(220 15% 90%)" }}
                  >
                    {att.preview ? (
                      <img src={att.preview} alt={att.name} className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <span style={{ color: "hsl(220 15% 50%)" }}>{fileIcon(att.type)}</span>
                    )}
                    <span className="text-[11px] font-medium truncate max-w-[100px]" style={{ color: "hsl(220 20% 25%)" }}>
                      {att.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="w-4 h-4 flex items-center justify-center rounded-full cursor-pointer opacity-60 hover:opacity-100"
                      style={{ background: "hsl(0 70% 55%)", color: "white" }}
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer toolbar */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-0.5">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ color: "hsl(220 15% 50%)" }}
                  title="Attach files"
                >
                  <Paperclip size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={startRecording}
                  className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ color: "hsl(220 15% 50%)" }}
                  title="Record voice note"
                  disabled={!!voiceNote}
                >
                  <Mic size={14} style={{ opacity: voiceNote ? 0.4 : 1 }} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { setBody(body + "@"); handleInput(body + "@"); inputRef.current?.focus(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ color: "hsl(220 15% 50%)" }}
                  title="Mention"
                >
                  <AtSign size={14} />
                </motion.button>
              </div>

              <div className="flex items-center gap-1">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="h-7 px-2.5 text-[11px] font-medium rounded-full cursor-pointer"
                    style={{ color: "hsl(220 15% 50%)" }}
                  >
                    Cancel
                  </button>
                )}
                <motion.button
                  whileHover={hasContent ? { scale: 1.05 } : {}}
                  whileTap={hasContent ? { scale: 0.95 } : {}}
                  onClick={handleSubmit}
                  disabled={!hasContent}
                  className="h-7 w-7 rounded-full flex items-center justify-center"
                  style={{
                    background: hasContent ? "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))" : "hsl(220 15% 92%)",
                    color: hasContent ? "white" : "hsl(220 15% 60%)",
                    cursor: hasContent ? "pointer" : "not-allowed",
                    boxShadow: hasContent ? "0 2px 6px hsl(270 60% 55% / 0.3)" : "none",
                  }}
                  title="Send (Enter)"
                >
                  <Send size={12} />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommentPrompter;
