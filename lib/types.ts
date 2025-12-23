export type Role = 'COMMITTEE' | 'MANAGER' | 'ASST' | 'HEAD' | 'STAFF';

export type View =
  | 'login'
  | 'dashboard'
  | 'admin'
  | 'evaluation'
  | 'individual'
  | 'summary'
  | 'progress'
  | 'profile';

export interface UserPermissions {
  canManageUsers?: boolean;
  canManageCriteria?: boolean;
  canManageAdjustments?: boolean;
  canUseAITool?: boolean;
  canManageSystem?: boolean;
  canViewReport?: boolean;
}
export interface User {
  internalId: string;
  memberId?: string;
  orgId: number;
  name: string;
  position: string;
  salary: number | null;
  salaryGroup: string;
  role: Role;
  dept: string;
  parentInternalId: string | null;
  img: string;
  isAdmin: boolean;
  canViewReport: boolean; // Maintained for backward compatibility and as a quick toggle
  isActive: boolean;
  permissions?: UserPermissions;
  mobile?: string;
  email?: string;
  weight?: number; // Dynamic weight for evaluation
}

export interface Target extends User {
  type: string;
}

export interface Criteria {
  id: string;
  text: string;
  category: 'PERF' | 'CHAR' | 'EXEC' | 'CORE' | 'FUNC' | 'MGT';
  weight: number;
  description?: string;
}

export interface CriteriaCategory {
  id: string;
  name: string;
  color: string;
}

export interface ScoreData {
  [personInternalId: string]: {
    [criteriaId: string]: number;
  };
}

export interface CommentData {
  [personInternalId: string]: string;
}

export interface Exclusion {
  id?: number;
  evaluatorId: number;
  targetId: number;
  reason?: string;
}

export interface SystemConfig {
  startDate: string;
  endDate: string;
  sendEmailCopy: boolean;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpEncryption?: 'none' | 'ssl' | 'tls';
  deptAdjustment?: DeptAdjustment;
}

export interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  user: string;
}

export interface DeptAdjustment {
  [key: string]: number;
}
