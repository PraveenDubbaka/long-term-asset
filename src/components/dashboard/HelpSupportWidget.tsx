import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HelpCircle,
  X,
  Search,
  Send,
  Ticket,
  MessageSquare,
  Home,
  LifeBuoy,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { subscribeLukaOpen, getLukaOpen } from "@/lib/lukaOpenStore";

type View = "home" | "ticket" | "success";
type Tab = "home" | "messages" | "tickets" | "help";
type Category = "bug" | "feature" | "billing" | "other";
type Priority = "low" | "normal" | "high" | "urgent";

const ticketSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty({ message: "Please enter your name" })
    .max(100, { message: "Name must be under 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Enter a valid email address" })
    .max(255, { message: "Email must be under 255 characters" }),
  category: z.enum(["bug", "feature", "billing", "other"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  subject: z
    .string()
    .trim()
    .min(4, { message: "Subject must be at least 4 characters" })
    .max(120, { message: "Subject must be under 120 characters" }),
  description: z
    .string()
    .trim()
    .min(20, { message: "Please describe the issue (min 20 characters)" })
    .max(1000, { message: "Description must be under 1000 characters" }),
});

type TicketForm = z.infer<typeof ticketSchema>;
type FormErrors = Partial<Record<keyof TicketForm, string>>;

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature" },
  { id: "billing", label: "Billing" },
  { id: "other", label: "Other" },
];

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

const initialForm: TicketForm = {
  name: "",
  email: "",
  category: "bug",
  priority: "normal",
  subject: "",
  description: "",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB total
const MAX_FILES = 5;
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

type Attachment = {
  id: string;
  file: File;
  preview?: string;
};

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const HelpSupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [view, setView] = useState<View>("home");
  const [form, setForm] = useState<TicketForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [lukaOpen, setLukaOpenState] = useState(getLukaOpen());

  useEffect(() => {
    return subscribeLukaOpen(setLukaOpenState);
  }, []);


  const resetTicket = () => {
    setForm(initialForm);
    setErrors({});
    setTicketId("");
    setAttachments((prev) => {
      prev.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
      return [];
    });
  };

  const goHome = () => {
    setView("home");
    setActiveTab("home");
    resetTicket();
  };

  const openTicketView = () => {
    resetTicket();
    setView("ticket");
    setActiveTab("tickets");
  };

  const updateField = <K extends keyof TicketForm>(key: K, value: TicketForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;

    const currentTotal = attachments.reduce((sum, a) => sum + a.file.size, 0);
    const accepted: Attachment[] = [];
    let runningTotal = currentTotal;
    let slotsLeft = MAX_FILES - attachments.length;

    for (const file of incoming) {
      if (slotsLeft <= 0) {
        toast.error(`You can attach up to ${MAX_FILES} files`);
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" — unsupported file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds ${formatBytes(MAX_FILE_SIZE)} per-file limit`);
        continue;
      }
      if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        toast.error(`Total attachments would exceed ${formatBytes(MAX_TOTAL_SIZE)}`);
        break;
      }
      runningTotal += file.size;
      slotsLeft -= 1;
      accepted.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }

    if (accepted.length) setAttachments((prev) => [...prev, ...accepted]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const next = prev.filter((a) => a.id !== id);
      const removed = prev.find((a) => a.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  useEffect(() => {
    if (!lightboxId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = ticketSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TicketForm;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    // Build multipart payload — ready for a real endpoint when wired up.
    const payload = new FormData();
    Object.entries(result.data).forEach(([k, v]) => payload.append(k, String(v)));
    attachments.forEach((a) => payload.append("attachments", a.file, a.file.name));
    await new Promise((r) => setTimeout(r, 900));
    const id = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(id);
    setSubmitting(false);
    setView("success");
    toast.success(
      attachments.length
        ? `Ticket submitted with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}`
        : "Ticket submitted successfully"
    );
  };


  const inputBase =
    "w-full rounded-lg border bg-card px-3 py-2 font-dm-sans text-sm text-foreground placeholder:text-muted-foreground/70 transition focus:outline-none focus:ring-2 focus:ring-primary/30";
  const errCls = (k: keyof TicketForm) =>
    errors[k] ? "border-destructive/60 focus:ring-destructive/25" : "border-border/60 focus:border-primary/50";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="help-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-6 z-[60] flex w-[480px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[20px] border border-white/40 bg-white/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl"
            style={{ height: "calc(100vh - 7rem)", maxHeight: "820px" }}
            role="dialog"
            aria-label="Help and support"
          >
            {/* Header */}
            <div className="relative shrink-0 bg-primary px-6 pt-6 pb-10 text-primary-foreground">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {view !== "home" && (
                    <button
                      onClick={goHome}
                      className="rounded-md p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
                      aria-label="Back"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close help and support"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 space-y-1">
                {view === "home" && (
                  <>
                    <h2 className="font-rajdhani text-2xl font-semibold tracking-tight">
                      Hi there <span className="inline-block">👋</span>
                    </h2>
                    <p className="font-rajdhani text-2xl font-semibold tracking-tight text-white/85">
                      How can we help?
                    </p>
                  </>
                )}
                {view === "ticket" && (
                  <>
                    <h2 className="font-rajdhani text-2xl font-semibold tracking-tight">Create a ticket</h2>
                    <p className="font-dm-sans text-sm text-white/80">
                      Tell us what's wrong and we'll get back to you.
                    </p>
                  </>
                )}
                {view === "success" && (
                  <>
                    <h2 className="font-rajdhani text-2xl font-semibold tracking-tight">Ticket received</h2>
                    <p className="font-dm-sans text-sm text-white/80">
                      Our team will be in touch shortly.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {view === "home" && (
                <div className="-mt-6 space-y-3 px-4 pb-4">
                  <button className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md">
                    <span className="font-dm-sans text-sm font-semibold text-foreground">Search for help</span>
                    <Search className="h-4 w-4 text-primary" />
                  </button>
                  <button className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md">
                    <span className="font-dm-sans text-sm font-semibold text-foreground">Start a conversation</span>
                    <Send className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    onClick={openTicketView}
                    className="flex w-full flex-col gap-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-dm-sans text-sm font-semibold text-foreground">Create a ticket</span>
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-dm-sans text-xs text-muted-foreground">
                      Report a bug, request a feature, or ask billing
                    </span>
                  </button>
                </div>
              )}

              {view === "ticket" && (
                <form onSubmit={handleSubmit} className="-mt-6 space-y-4 px-4 pb-4" noValidate>
                  <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Name
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          maxLength={100}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="Sidd"
                          className={`${inputBase} ${errCls("name")} mt-1`}
                        />
                        {errors.name && (
                          <p className="mt-1 font-dm-sans text-[11px] text-destructive">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Email
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          maxLength={255}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="you@firm.com"
                          className={`${inputBase} ${errCls("email")} mt-1`}
                        />
                        {errors.email && (
                          <p className="mt-1 font-dm-sans text-[11px] text-destructive">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Category
                      </label>
                      <div className="mt-1 grid grid-cols-4 gap-1.5">
                        {CATEGORIES.map((c) => {
                          const active = form.category === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => updateField("category", c.id)}
                              className={`rounded-lg border px-2 py-1.5 font-dm-sans text-xs font-medium transition ${
                                active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Priority
                      </label>
                      <div className="mt-1 grid grid-cols-4 gap-1.5">
                        {PRIORITIES.map((p) => {
                          const active = form.priority === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => updateField("priority", p.id)}
                              className={`rounded-lg border px-2 py-1.5 font-dm-sans text-xs font-medium transition ${
                                active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        maxLength={120}
                        onChange={(e) => updateField("subject", e.target.value)}
                        placeholder="Brief summary"
                        className={`${inputBase} ${errCls("subject")} mt-1`}
                      />
                      {errors.subject && (
                        <p className="mt-1 font-dm-sans text-[11px] text-destructive">{errors.subject}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Description
                        </label>
                        <span className="font-share-tech-mono text-[10px] text-muted-foreground">
                          {form.description.length}/1000
                        </span>
                      </div>
                      <textarea
                        value={form.description}
                        maxLength={1000}
                        rows={4}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Describe the issue, steps to reproduce, expected vs actual…"
                        className={`${inputBase} ${errCls("description")} mt-1 resize-none`}
                      />
                      {errors.description && (
                        <p className="mt-1 font-dm-sans text-[11px] text-destructive">{errors.description}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <label className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Attachments
                        </label>
                        <span className="font-share-tech-mono text-[10px] text-muted-foreground">
                          {attachments.length}/{MAX_FILES} · {formatBytes(attachments.reduce((s, a) => s + a.file.size, 0))}
                        </span>
                      </div>

                      <label
                        htmlFor="ticket-attachments"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("border-primary/60", "bg-primary/5");
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove("border-primary/60", "bg-primary/5");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("border-primary/60", "bg-primary/5");
                          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                        }}
                        className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 bg-card px-3 py-4 text-center transition hover:border-primary/40 ${
                          attachments.length >= MAX_FILES ? "pointer-events-none opacity-60" : ""
                        }`}
                      >
                        <Paperclip className="h-4 w-4 text-primary" />
                        <span className="font-dm-sans text-xs font-medium text-foreground">
                          Drop files or click to upload
                        </span>
                        <span className="font-dm-sans text-[10px] text-muted-foreground">
                          PNG, JPG, PDF, DOC, XLS, CSV, TXT · up to {formatBytes(MAX_FILE_SIZE)} each
                        </span>
                        <input
                          id="ticket-attachments"
                          type="file"
                          multiple
                          accept={ACCEPT_ATTR}
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files) addFiles(e.target.files);
                            e.target.value = "";
                          }}
                          disabled={attachments.length >= MAX_FILES}
                        />
                      </label>

                      {attachments.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {attachments.map((a) => {
                            const isImg = !!a.preview;
                            return (
                              <li
                                key={a.id}
                                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1.5"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                                  {isImg ? (
                                    <button
                                      type="button"
                                      onClick={() => setLightboxId(a.id)}
                                      className="group relative h-full w-full cursor-pointer"
                                      aria-label={`Preview ${a.file.name}`}
                                    >
                                      <img
                                        src={a.preview}
                                        alt={a.file.name}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                                      />
                                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-black/0 transition group-hover:bg-black/25">
                                        <span className="font-dm-sans text-[9px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                          View
                                        </span>
                                      </div>
                                    </button>
                                  ) : a.file.type === "application/pdf" ? (
                                    <FileText className="h-4 w-4 text-primary" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-dm-sans text-xs font-medium text-foreground">
                                    {a.file.name}
                                  </p>
                                  <p className="font-share-tech-mono text-[10px] text-muted-foreground">
                                    {formatBytes(a.file.size)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(a.id)}
                                  className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                  aria-label={`Remove ${a.file.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>


                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-primary px-4 py-2.5 font-rajdhani text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit ticket
                      </>
                    )}
                  </button>
                </form>
              )}

              {view === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className="-mt-6 space-y-4 px-4 pb-4"
                >
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-6 text-center shadow-sm">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
                    >
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="font-rajdhani text-lg font-semibold text-foreground">
                        We've got your ticket
                      </h3>
                      <p className="mt-1 font-dm-sans text-xs text-muted-foreground">
                        A confirmation has been sent to{" "}
                        <span className="font-medium text-foreground">{form.email}</span>
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                      <Ticket className="h-3.5 w-3.5 text-primary" />
                      <span className="font-share-tech-mono text-xs tracking-wider text-foreground">
                        {ticketId}
                      </span>
                    </div>
                    {attachments.length > 0 && (
                      <p className="font-dm-sans text-[11px] text-muted-foreground">
                        Included {attachments.length} attachment
                        {attachments.length > 1 ? "s" : ""} ·{" "}
                        {formatBytes(attachments.reduce((s, a) => s + a.file.size, 0))}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={openTicketView}
                      className="rounded-[12px] border border-border/60 bg-card px-4 py-2.5 font-rajdhani text-xs font-semibold uppercase tracking-wider text-foreground transition hover:border-primary/40"
                    >
                      New ticket
                    </button>
                    <button
                      onClick={goHome}
                      className="rounded-[12px] bg-primary px-4 py-2.5 font-rajdhani text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:brightness-110"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Tab bar */}
            <div className="grid shrink-0 grid-cols-4 border-t border-border/60 bg-card/60">
              {[
                { id: "home", label: "Home", icon: Home, action: goHome },
                { id: "messages", label: "Messages", icon: MessageSquare, action: () => setActiveTab("messages") },
                { id: "tickets", label: "Tickets", icon: Ticket, action: openTicketView },
                { id: "help", label: "Help", icon: HelpCircle, action: () => setActiveTab("help") },
              ].map(({ id, label, icon: Icon, action }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={action}
                    className={`flex flex-col items-center gap-1 py-3 transition ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.8} />
                    <span className="font-rajdhani text-[11px] font-semibold uppercase tracking-wider">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxId && (() => {
          const a = attachments.find((x) => x.id === lightboxId);
          if (!a) return null;
          return (
            <motion.div
              key="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              onClick={() => setLightboxId(null)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-[20px] border border-white/40 bg-white/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <span className="truncate font-dm-sans text-sm font-medium text-foreground">
                    {a.file.name}
                  </span>
                  <button
                    onClick={() => setLightboxId(null)}
                    className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Close preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center bg-black/5 p-4">
                  <img
                    src={a.preview}
                    alt={a.file.name}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                  />
                </div>
                <div className="border-t border-border/60 px-4 py-2">
                  <p className="font-share-tech-mono text-[11px] text-muted-foreground">
                    {formatBytes(a.file.size)}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>



      {/* FAB */}
      {!lukaOpen && (
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-8px_hsl(var(--primary)/0.55)] ring-1 ring-white/30 transition hover:shadow-[0_18px_36px_-10px_hsl(var(--primary)/0.6)]"
          aria-label={open ? "Close help and support" : "Open help and support"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span
                key="help"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <HelpCircle className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </>
  );
};

export default HelpSupportWidget;
