// Base types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  members?: ProjectMember[];
  progress?: number;
  tasks_count?: number;
  completed_tasks_count?: number;
  taskStatuses?: TaskStatus[];
  task_statuses?: TaskStatus[];
  labels?: Label[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: number;
  project_id?: number;
  user_id?: number;
  role?: ProjectRole;
  created_at: string;
  updated_at: string;
  user?: User;
  name?: string;
  email?: string;
  avatar?: string;
  pivot?: {
    project_id: number;
    user_id: number;
    role: ProjectRole;
  };
}

export interface Task {
  id: number;
  project_id: number;
  status_id: number;
  creator_id: number;
  parent_id?: number;
  title: string;
  description?: string;
  priority: Priority;
  start_date?: string;
  due_date?: string;
  position: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  status?: TaskStatus;
  creator?: User;
  assignees?: User[];
  labels?: Label[];
  subtasks?: Task[];
  checklists?: Checklist[];
  comments?: Comment[];
  attachments?: Attachment[];
  comments_count?: number;
  attachments_count?: number;
}

export interface TaskStatus {
  id: number;
  project_id: number;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: number;
  task_id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: number;
  checklist_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  parent_id?: number;
  body: string;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Attachment {
  id: number;
  task_id: number;
  user_id: number;
  original_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Activity {
  id: number;
  project_id: number;
  user_id: number;
  action: string;
  subject_type: string;
  subject_id: number;
  metadata?: Record<string, any>;
  created_at: string;
  user?: User;
}

// Enums
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

// Form types
export interface CreateProjectData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  start_date?: string;
  due_date?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: Priority;
  start_date?: string;
  due_date?: string;
  assignee_ids?: number[];
  label_ids?: number[];
  status_id?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface ViewMode {
  type: 'board' | 'list' | 'calendar' | 'overview';
}

// Auth types
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}