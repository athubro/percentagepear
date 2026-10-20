/** Core data models for PercentagePear */

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'N/A';

export type AssignmentStatus =
  | 'graded'
  | 'missing'
  | 'late'
  | 'excused'
  | 'incomplete'
  | 'upcoming'
  | 'hypothetical';

export type GradingModel = 'total_points' | 'weighted_categories';

export interface Teacher {
  id: string;
  name: string;
  email?: string;
}

export interface GradingCategory {
  id: string;
  name: string;
  weight: number; // 0-100 percentage of total grade
  dropLowest?: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  name: string;
  categoryId: string;
  score: number | null; // null = not graded / missing
  pointsPossible: number;
  dueDate: string; // ISO date
  assignedDate?: string;
  status: AssignmentStatus;
  isHypothetical: boolean;
  notes?: string;
  extraCredit?: boolean;
}

export interface Course {
  id: string;
  name: string;
  teacher: Teacher;
  period: number | string;
  room?: string;
  color: string;
  gradingModel: GradingModel;
  categories: GradingCategory[];
  assignments: Assignment[];
  officialGrade?: number | null; // from StudentVUE if available
  officialLetter?: LetterGrade;
  markingPeriod?: string;
}

export interface ScheduleEntry {
  id: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  period: number | string;
  room: string;
  startTime: string;
  endTime: string;
  days: string[]; // e.g. ['M', 'T', 'W', 'Th', 'F']
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseId?: string;
  courseName?: string;
  status: 'present' | 'absent' | 'tardy' | 'excused' | 'unexcused';
  period?: string;
  reason?: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  gradeLevel: number;
  school: string;
  studentId?: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  baselineSnapshot: {
    grade: number;
    letter: LetterGrade;
    assignments: Assignment[];
  };
  hypotheticalAssignments: Assignment[];
  modifiedScores: Record<string, number | null>; // assignmentId -> new score
  notes?: string;
}

export interface CalculatedGrade {
  percentage: number;
  letter: LetterGrade;
  earnedPoints: number;
  possiblePoints: number;
  byCategory: {
    categoryId: string;
    name: string;
    weight: number;
    earned: number;
    possible: number;
    percentage: number;
    contribution: number;
  }[];
  method: GradingModel;
  warnings: string[];
}

export interface TargetGradeResult {
  targetPercentage: number;
  targetLetter: LetterGrade;
  requiredScore: number | null;
  requiredPercentage: number | null;
  pointsPossible: number;
  achievable: boolean;
  message: string;
  assumptions: string[];
}

export type AppMode = 'guest' | 'studentvue';

export interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  gradeRounding: number; // decimal places
  showLetterGrades: boolean;
  defaultTargetLetter: LetterGrade;
}
