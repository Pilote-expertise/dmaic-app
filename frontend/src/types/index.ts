// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'CONTRIBUTOR';
  avatar?: string;
  createdAt: string;
}

// Project types
export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD' | 'CANCELLED';
export type DmaicPhase = 'DEFINE' | 'MEASURE' | 'ANALYZE' | 'IMPROVE' | 'CONTROL';
export type ToolPriority = 'OBLIGATORY' | 'RECOMMENDED' | 'SITUATIONAL';
export type ToolStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TemplateType = 'MATRIX' | 'FORM' | 'DIAGRAM' | 'CHART' | 'CALCULATION' | 'CHECKLIST' | 'RICH_TEXT';

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ProjectStatus;
  currentPhase: DmaicPhase;
  startDate?: string;
  endDate?: string;
  ownerId: string;
  owner: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  members: ProjectMember[];
  progress?: number;
  toolsCompleted?: number;
  toolsTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  role: 'EDITOR' | 'VIEWER';
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatar'>;
}

// Tool types
export interface ToolDefinition {
  id: string;
  code: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  phase: DmaicPhase;
  priority: ToolPriority;
  templateType: TemplateType;
  schema: Record<string, unknown>;
  helpContent?: string;
  iconName?: string;
  order: number;
}

export interface ToolInstance {
  id: string;
  phase: DmaicPhase;
  status: ToolStatus;
  data: Record<string, unknown>;
  version: number;
  completedAt?: string;
  projectId: string;
  toolDefinitionId: string;
  toolDefinition: ToolDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface ToolVersion {
  id: string;
  version: number;
  data: Record<string, unknown>;
  createdAt: string;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

// Dashboard types
export interface PhaseProgress {
  phase: DmaicPhase;
  total: number;
  completed: number;
  progress: number;
}

export interface ProjectDashboard {
  project: Pick<Project, 'id' | 'name' | 'code' | 'status' | 'currentPhase' | 'startDate' | 'endDate'>;
  progress: {
    overall: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    total: number;
  };
  phaseStats: PhaseProgress[];
  team: Array<Pick<User, 'firstName' | 'lastName' | 'avatar'> & { role: string }>;
  recentActivity: AuditLog[];
}

// Audit & Activity types
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  createdAt: string;
  user: Pick<User, 'firstName' | 'lastName' | 'avatar'>;
  project?: Pick<Project, 'name'>;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateProjectData {
  name: string;
  code: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// Form types for tool templates
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'currency' | 'rating' | 'calculated' | 'richtext' | 'user' | 'userList';
  required?: boolean;
  options?: string[];
  formula?: string;
  default?: unknown;
  readonly?: boolean;
}

export interface MatrixColumn {
  name: string;
  label: string;
  type: string;
  options?: string[];
  max?: number;
}

export interface ChecklistItem {
  name: string;
  label: string;
}

export interface ChecklistSection {
  name: string;
  label: string;
  items: ChecklistItem[];
}
