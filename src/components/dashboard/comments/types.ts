export type CommentStatus = "draft" | "published" | "resolved" | "locked";
export type UserRole = "preparer" | "reviewer" | "manager" | "read_only" | "external";

export interface CommentUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  avatarColor: string;
  email: string;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface CommentReaction {
  emoji: string;
  userIds: string[];
}

export interface CommentVoiceNote {
  id: string;
  durationSec: number;
  url?: string;
}

export interface CommentReply {
  id: string;
  author: CommentUser;
  body: string;
  richBody?: string;
  createdAt: Date;
  editedAt?: Date;
  mentions: string[];
  reactions?: CommentReaction[];
  attachments?: CommentAttachment[];
  voiceNote?: CommentVoiceNote;
}

export interface Comment {
  id: string;
  author: CommentUser;
  body: string;
  richBody?: string;
  status: CommentStatus;
  createdAt: Date;
  editedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: CommentUser;
  lockedAt?: Date;
  mentions: string[];
  replies: CommentReply[];
  attachments: CommentAttachment[];
  anchor: CommentAnchor;
  pinNumber: number;
  reactions?: CommentReaction[];
  voiceNote?: CommentVoiceNote;
}

export interface CommentAnchor {
  screen: string;       // e.g. "Balance Sheet", "Cover Page"
  section?: string;     // e.g. "Current Assets"
  lineItem?: string;    // e.g. "Cash and cash equivalents"
  lineId?: string;      // e.g. "TB-1001" or "ADJ-042"
  row?: number;
  yPosition?: number;   // percentage from top for pin placement
  xPosition?: number;   // percentage from left for pin placement
}

export interface AuditLogEntry {
  id: string;
  commentId: string;
  action: "created" | "edited" | "published" | "resolved" | "reopened" | "deleted" | "locked" | "replied";
  user: CommentUser;
  timestamp: Date;
  details?: string;
}

export interface Notification {
  id: string;
  type: "mention" | "reply" | "resolved" | "new_comment";
  fromUser: CommentUser;
  commentId: string;
  preview: string;
  engagementName: string;
  anchor: CommentAnchor;
  read: boolean;
  createdAt: Date;
}

export type CommentFilter = "all" | "open" | "resolved" | "draft" | "locked" | "mine";
