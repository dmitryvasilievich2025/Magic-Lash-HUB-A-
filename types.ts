
export type UserRole = 'guest' | 'student' | 'specialist' | 'admin';
export type Language = 'uk' | 'en';

export type TabType = 'showcase' | 'my-courses' | 'courses-admin' | 'finance' | 'ai-lab' | 'live-assistant' | 'guest-chat' | 'specialist-dashboard';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Step {
  id: number;
  type: 'lecture' | 'quiz' | 'interaction';
  title: string;
  description?: string; // Added description
  aiPrompt?: string;      
  videoPrompt?: string;   
  interactionPrompt?: string; 
  ragQuery?: string;
  media?: string;       // Video or Photo
  thumbnail?: string;   // Cover image
  
  // Legacy single question fields (optional compatibility)
  question?: string;
  correctAnswer?: string;

  // New Quiz Structure
  quizQuestions?: QuizQuestion[];
  
  comments?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string; // Added description
  steps: Step[];
  media?: string;       // Video or Photo
  thumbnail?: string;
  aiPrompt?: string;      
  videoPrompt?: string;   
  interactionPrompt?: string; 
  ragQuery?: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  media?: string; // Video or Photo
  thumbnail?: string;
  lessons: Lesson[];
}

export interface CourseSettings {
  category?: string;
  pace?: 'self-paced' | 'scheduled'; // Темп: В собственном темпе / По расписанию
  timeLimitDays?: number; // Ограничение времени (дней)
  accessMode?: 'linear' | 'any_order'; // Доступ к заданиям: В любом порядке / Линейно
  requireVideoWatch?: boolean; // Требовать просмотр видео
  autoPlayNext?: boolean; // Автовоспроизведение
  visibility?: 'public' | 'private' | 'unlisted'; // Видимость
  participationLimit?: number; // Лимит участия
}

export interface CourseMember {
  id: string;
  name: string;
  role: 'student' | 'instructor' | 'curator';
  avatar?: string;
  joinedAt: string;
}

export interface Course {
  id: string;
  title: string;
  // Replaces direct lessons with sections
  sections: Section[]; 
  // Backward compatibility (optional, but we will migrate data on load)
  lessons?: Lesson[]; 
  
  price?: number;
  currency?: string; // Added currency support
  description?: string;
  image?: string;
  previewVideo?: string; 
  isExtensionCourse?: boolean; 
  studentCount?: number;
  isPublished?: boolean; 
  
  // New Expanded Settings
  settings?: CourseSettings;
  team?: CourseMember[]; // Employees/Instructors
  participants?: CourseMember[]; // Students specific to this course
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Invoice {
  id: string;
  student: string;
  studentId?: string;
  studentEmail?: string;     
  studentPhone?: string;     
  studentInstagram?: string; 
  instructorName?: string;
  course: string;
  total: number;
  paid: number; 
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  dueDate: string;
  payments: PaymentRecord[];
}

export interface ScoreBreakdown {
  symmetry: number;
  direction: number;
  cleanliness: number;
}

export interface AuditResult {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  improvements: string[];
  advice: string;
}
