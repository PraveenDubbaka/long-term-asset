export interface FSVersionAuthor {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
}

export interface FSVersionChange {
  screen: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface FSVersion {
  id: string;
  versionNumber: string;
  label: string;
  timestamp: Date;
  author: FSVersionAuthor;
  description: string;
  scope: "engagement" | "statement";
  screens: string[];
  changes: FSVersionChange[];
  isCurrent?: boolean;
}
