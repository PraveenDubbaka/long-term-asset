import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "./CommentContext";
import type { CommentUser } from "./types";
import { AtSign, X, Upload, FileText, Image, File } from "lucide-react";

interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface CommentInputProps {
  onSubmit: (body: string, mentions: string[], isDraft: boolean) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <Image size={12} />;
  if (type.includes("pdf") || type.includes("document")) return <FileText size={12} />;
  return <File size={12} />;
};

const CommentInput = ({ onSubmit, onCancel, placeholder = "Add a comment…", autoFocus = true, compact = false }: CommentInputProps) => {
  const { members, currentUser } = useComments();
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isDraft, setIsDraft] = useState(true);
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: AttachedFile[] = Array.from(files).map(file => {
      const att: AttachedFile = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      };
      if (file.type.startsWith("image/")) {
        att.preview = URL.createObjectURL(file);
      }
      return att;
    });
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && onCancel) onCancel();
    if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") { e.preventDefault(); }
  };

  const hasContent = body.trim() || attachments.length > 0;

  const handleSubmit = () => {
    if (!hasContent) return;
    onSubmit(body.trim(), mentions, isDraft);
    setBody("");
    setMentions([]);
    setAttachments(prev => {
      prev.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); });
      return [];
    });
    setIsDraft(true);
  };

  return (
    <div
      ref={dropZoneRef}
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
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

      {/* Format bar on text selection */}
      <AnimatePresence>
        {showFormatBar && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute -top-8 left-2 flex items-center gap-0.5 rounded-md px-1 py-0.5 z-50"
            style={{ background: "hsl(220 20% 20%)", border: "1px solid hsl(220 20% 30%)" }}
          >
            {["B", "I", "•"].map(f => (
              <button key={f} className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">{f}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-lg border transition-colors relative overflow-hidden"
        style={{
          background: "hsl(0 0% 100%)",
          borderColor: isDragging ? "hsl(215 80% 55%)" : body ? "hsl(215 55% 65%)" : "hsl(220 15% 88%)",
          boxShadow: isDragging ? "0 0 0 2px hsl(215 80% 55% / 0.2)" : "none",
        }}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-lg pointer-events-none"
              style={{ background: "hsl(215 80% 55% / 0.08)", border: "2px dashed hsl(215 80% 55% / 0.4)" }}
            >
              <Upload size={20} style={{ color: "hsl(215 80% 55%)" }} />
              <span className="text-xs font-medium mt-1" style={{ color: "hsl(215 80% 45%)" }}>
                Drop files here
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={() => {
            if (inputRef.current) {
              const sel = inputRef.current.selectionEnd - inputRef.current.selectionStart;
              setShowFormatBar(sel > 0);
            }
          }}
          onBlur={() => setTimeout(() => setShowFormatBar(false), 200)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="w-full resize-none border-none outline-none bg-transparent px-3 py-2.5 text-[14px]"
          style={{ color: "hsl(220 20% 15%)", minHeight: compact ? 48 : 72 }}
        />

        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-2 pb-1.5 flex flex-wrap gap-1.5 overflow-hidden"
            >
              {attachments.map(att => (
                <motion.div
                  key={att.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative group flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{
                    background: "hsl(220 15% 96%)",
                    border: "1px solid hsl(220 15% 90%)",
                  }}
                >
                  {att.preview ? (
                    <img
                      src={att.preview}
                      alt={att.name}
                      className="w-6 h-6 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <span style={{ color: "hsl(220 15% 50%)" }} className="flex-shrink-0">
                      {getFileIcon(att.type)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium truncate max-w-[100px]" style={{ color: "hsl(220 20% 25%)" }}>
                      {att.name}
                    </p>
                    <p className="text-[9px]" style={{ color: "hsl(220 15% 55%)" }}>
                      {formatFileSize(att.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ background: "hsl(0 70% 55%)", color: "white" }}
                  >
                    <X size={8} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mention dropdown */}
        <AnimatePresence>
          {showMentions && filteredMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-2 right-2 z-50 rounded-lg overflow-hidden"
              style={{
                bottom: "100%",
                marginBottom: 4,
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 15% 88%)",
                boxShadow: "0 8px 24px hsl(220 20% 10% / 0.12)",
              }}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(220 15% 55%)" }}>
                Engagement Members
              </div>
              {filteredMembers.map(m => (
                <motion.button
                  key={m.id}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
                  style={{ color: "hsl(220 20% 15%)" }}
                  whileHover={{ backgroundColor: "hsl(220 15% 96%)" }}
                  onClick={() => insertMention(m)}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ background: m.avatarColor }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="ml-2 text-[11px] capitalize" style={{ color: "hsl(220 15% 55%)" }}>{m.role}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between px-2 py-1.5 border-t" style={{ borderColor: "hsl(220 15% 93%)" }}>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setBody(body + "@"); handleInput(body + "@"); }}
              className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
              style={{ color: "hsl(220 15% 50%)" }}
              title="Mention someone"
            >
              <AtSign size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
              style={{ color: "hsl(220 15% 50%)" }}
              title="Attach file (or drag & drop)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer text-xs font-bold"
              style={{ color: "hsl(220 15% 50%)" }}
              title="Bold"
            >
              B
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer text-xs italic"
              style={{ color: "hsl(220 15% 50%)" }}
              title="Italic"
            >
              I
            </motion.button>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsDraft(!isDraft)}
              className="h-7 px-2.5 rounded-md text-[11px] font-semibold cursor-pointer flex items-center gap-1"
              style={{
                background: isDraft ? "hsl(40 90% 95%)" : "hsl(145 50% 93%)",
                color: isDraft ? "hsl(40 80% 35%)" : "hsl(145 60% 30%)",
                border: `1px solid ${isDraft ? "hsl(40 80% 80%)" : "hsl(145 50% 75%)"}`,
              }}
            >
              {isDraft ? "Draft" : "Publish"}
            </motion.button>
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
                style={{ color: "hsl(220 15% 50%)" }}
              >
                <X size={14} />
              </motion.button>
            )}
            <motion.button
              whileHover={hasContent ? { scale: 1.05 } : {}}
              whileTap={hasContent ? { scale: 0.95 } : {}}
              onClick={handleSubmit}
              disabled={!hasContent}
              className="h-7 px-3 rounded-md text-[11px] font-semibold cursor-pointer"
              style={{
                background: hasContent ? "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))" : "hsl(220 15% 90%)",
                color: hasContent ? "white" : "hsl(220 15% 60%)",
                cursor: hasContent ? "pointer" : "not-allowed",
              }}
            >
              {isDraft ? "Save Draft" : "Post"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mentions chips */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {mentions.map(mid => {
            const member = members.find(m => m.id === mid);
            if (!member) return null;
            return (
              <span
                key={mid}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "hsl(270 60% 95%)", color: "hsl(270 60% 40%)", border: "1px solid hsl(270 60% 85%)" }}
              >
                @{member.name}
                <button
                  onClick={() => setMentions(prev => prev.filter(id => id !== mid))}
                  className="cursor-pointer hover:text-red-500"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentInput;
