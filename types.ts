
export type UserRole = 'guest' | 'student' | 'specialist' | 'admin';
export type Language = 'uk' | 'en';

export type TabType = 'showcase' | 'my-courses' | 'courses-admin' | 'finance' | 'ai-lab' | 'live-assistant' | 'guest-chat' | 'specialist-dashboard';

export interface Step {
  id: number;
  type: 'lecture' | 'quiz' | 'interaction';
  title: string;
  aiPrompt?: string;
  ragQuery?: string;
  media?: string;
  question?: string;
  correctAnswer?: string;
  comments?: string;
}

export interface Lesson {
  id: string;
  title: string;
  steps: Step[];
  media?: string;
  aiPrompt?: string;
  ragQuery?: string;
}

export interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
  price?: number;
  description?: string;
  image?: string;
  isExtensionCourse?: boolean; // true - Magic Lash (нарощування), false - InLei (ламінування)
  studentCount?: number;
}

export interface Invoice {
  id: string;
  student: string;
  studentId?: string; // Внутрішній ID студента
  course: string;
  total: number;
  paid: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  dueDate: string;
}
