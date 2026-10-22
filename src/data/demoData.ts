/**
 * Fictional demo data for PercentagePear Guest Mode.
 * School: PercentagePear Demo High School
 * All names, courses, and grades are entirely fictional.
 */

import type {
  StudentInfo,
  Course,
  ScheduleEntry,
  AttendanceRecord,
  Assignment,
} from '../types';
import { v4 as uuid } from 'uuid';

export const DEMO_STUDENT: StudentInfo = {
  id: 'demo-student-1',
  name: 'Triple T',
  gradeLevel: 11,
  school: 'Tung Tung Tung Sacool',
  studentId: 'PP-2026-0042',
};

const teachers = {
  chen: { id: 't1', name: 'Dr. Maya Chen', email: 'mchen@ppdemo.edu' },
  brooks: { id: 't2', name: 'Mr. Daniel Brooks', email: 'dbrooks@ppdemo.edu' },
  patel: { id: 't3', name: 'Ms. Elena Patel', email: 'epatel@ppdemo.edu' },
  bennett: { id: 't4', name: 'Mrs. Olivia Bennett', email: 'obennett@ppdemo.edu' },
  reed: { id: 't5', name: 'Mr. Marcus Reed', email: 'mreed@ppdemo.edu' },
  carter: { id: 't6', name: 'Ms. Sophia Carter', email: 'scarter@ppdemo.edu' },
  torres: { id: 't7', name: 'Señora Isabella Torres', email: 'itorres@ppdemo.edu' },
};

function a(
  courseId: string,
  name: string,
  catId: string,
  score: number | null,
  pts: number,
  due: string,
  status: Assignment['status'] = score != null ? 'graded' : 'upcoming',
  extra = false
): Assignment {
  return {
    id: uuid(),
    courseId,
    name,
    categoryId: catId,
    score,
    pointsPossible: pts,
    dueDate: due,
    status,
    isHypothetical: false,
    extraCredit: extra,
  };
}

export const DEMO_COURSES: Course[] = [
  {
    id: 'c-bio',
    name: 'Honors Biology',
    teacher: teachers.chen,
    period: 1,
    room: 'S-204',
    color: '#22c55e',
    gradingModel: 'weighted_categories',
    markingPeriod: 'Q1 2025-26',
    categories: [
      { id: 'bio-tests', name: 'Tests', weight: 40 },
      { id: 'bio-labs', name: 'Labs', weight: 30 },
      { id: 'bio-hw', name: 'Homework', weight: 20 },
      { id: 'bio-part', name: 'Participation', weight: 10 },
    ],
    assignments: [
      a('c-bio', 'Cell Structure Quiz', 'bio-tests', 18, 20, '2025-09-12'),
      a('c-bio', 'Mitosis Lab Report', 'bio-labs', 27, 30, '2025-09-19'),
      a('c-bio', 'Chapter 3 Homework', 'bio-hw', 10, 10, '2025-09-10'),
      a('c-bio', 'Chapter 4 Homework', 'bio-hw', 8, 10, '2025-09-17'),
      a('c-bio', 'Enzyme Lab', 'bio-labs', 28, 30, '2025-09-26'),
      a('c-bio', 'Unit 1 Test', 'bio-tests', 42, 50, '2025-10-03'),
      a('c-bio', 'Microscope Practical', 'bio-labs', null, 20, '2025-10-15', 'upcoming'),
      a('c-bio', 'Genetics Problem Set', 'bio-hw', null, 15, '2025-10-20', 'upcoming'),
      a('c-bio', 'Participation Q1', 'bio-part', 9, 10, '2025-10-01'),
    ],
  },
  {
    id: 'c-chem',
    name: 'Honors Chemistry',
    teacher: teachers.brooks,
    period: 2,
    room: 'S-110',
    color: '#3b82f6',
    gradingModel: 'weighted_categories',
    markingPeriod: 'Q1 2025-26',
    categories: [
      { id: 'chem-tests', name: 'Assessments', weight: 50 },
      { id: 'chem-labs', name: 'Lab Work', weight: 30 },
      { id: 'chem-hw', name: 'Practice', weight: 20 },
    ],
    assignments: [
      a('c-chem', 'Atomic Theory Quiz', 'chem-tests', 16, 20, '2025-09-08'),
      a('c-chem', 'Flame Test Lab', 'chem-labs', 22, 25, '2025-09-15'),
      a('c-chem', 'Mole Conversions HW', 'chem-hw', 12, 15, '2025-09-12'),
      a('c-chem', 'Periodic Trends Test', 'chem-tests', 38, 50, '2025-09-29'),
      a('c-chem', 'Stoichiometry Lab', 'chem-labs', 18, 25, '2025-10-06'),
      a('c-chem', 'Balancing Equations', 'chem-hw', null, 10, '2025-09-22', 'missing'),
      a('c-chem', 'Gas Laws Quiz', 'chem-tests', null, 25, '2025-10-17', 'upcoming'),
      a('c-chem', 'Titration Lab', 'chem-labs', null, 30, '2025-10-24', 'upcoming'),
    ],
  },
  {
    id: 'c-precalc',
    name: 'Magnet Precalculus',
    teacher: teachers.patel,
    period: 3,
    room: 'M-305',
    color: '#a855f7',
    gradingModel: 'total_points',
    markingPeriod: 'Q1 2025-26',
    categories: [{ id: 'pre-all', name: 'All Assignments', weight: 100 }],
    assignments: [
      a('c-precalc', 'Functions Review', 'pre-all', 28, 30, '2025-09-05'),
      a('c-precalc', 'Polynomial Quiz', 'pre-all', 17, 20, '2025-09-12'),
      a('c-precalc', 'Rational Expressions', 'pre-all', 22, 25, '2025-09-19'),
      a('c-precalc', 'Unit 1 Exam', 'pre-all', 78, 100, '2025-09-26'),
      a('c-precalc', 'Trig Intro HW', 'pre-all', 14, 15, '2025-10-03'),
      a('c-precalc', 'Unit Circle Quiz', 'pre-all', null, 20, '2025-10-10', 'upcoming'),
      a('c-precalc', 'Midterm Exam', 'pre-all', null, 100, '2025-10-31', 'upcoming'),
    ],
  },
  {
    id: 'c-eng',
    name: 'AP English Language',
    teacher: teachers.bennett,
    period: 4,
    room: 'E-112',
    color: '#ef4444',
    gradingModel: 'weighted_categories',
    markingPeriod: 'Q1 2025-26',
    categories: [
      { id: 'eng-essays', name: 'Essays', weight: 45 },
      { id: 'eng-mc', name: 'Multiple Choice', weight: 25 },
      { id: 'eng-part', name: 'Participation & Discussion', weight: 15 },
      { id: 'eng-hw', name: 'Homework', weight: 15 },
    ],
    assignments: [
      a('c-eng', 'Rhetorical Analysis Essay 1', 'eng-essays', 42, 50, '2025-09-15'),
      a('c-eng', 'MC Practice Set A', 'eng-mc', 18, 20, '2025-09-08'),
      a('c-eng', 'Socratic Seminar 1', 'eng-part', 9, 10, '2025-09-10'),
      a('c-eng', 'Vocabulary Quiz 1', 'eng-hw', 14, 15, '2025-09-12'),
      a('c-eng', 'Argument Essay 1', 'eng-essays', 44, 50, '2025-09-29'),
      a('c-eng', 'MC Practice Set B', 'eng-mc', 16, 20, '2025-09-22'),
      a('c-eng', 'Synthesis Essay', 'eng-essays', null, 50, '2025-10-20', 'upcoming'),
      a('c-eng', 'Discussion Board 3', 'eng-part', null, 10, '2025-10-13', 'upcoming'),
    ],
  },
  {
    id: 'c-gov',
    name: 'AP Government',
    teacher: teachers.reed,
    period: 5,
    room: 'H-201',
    color: '#f59e0b',
    gradingModel: 'weighted_categories',
    markingPeriod: 'Q1 2025-26',
    categories: [
      { id: 'gov-tests', name: 'Tests & FRQs', weight: 50 },
      { id: 'gov-proj', name: 'Projects', weight: 30 },
      { id: 'gov-hw', name: 'Homework', weight: 20 },
    ],
    assignments: [
      a('c-gov', 'Constitution Quiz', 'gov-tests', 19, 20, '2025-09-09'),
      a('c-gov', 'Federalism FRQ', 'gov-tests', 7, 10, '2025-09-16'),
      a('c-gov', 'Current Events Journal 1', 'gov-hw', 10, 10, '2025-09-13'),
      a('c-gov', 'Branch Comparison Project', 'gov-proj', 45, 50, '2025-09-30'),
      a('c-gov', 'Bill of Rights Test', 'gov-tests', 41, 50, '2025-10-07'),
      a('c-gov', 'Supreme Court Case Brief', 'gov-proj', null, 40, '2025-10-21', 'upcoming'),
      a('c-gov', 'Electoral Process HW', 'gov-hw', null, 10, '2025-10-14', 'upcoming'),
    ],
  },
  {
    id: 'c-ce',
    name: 'Civil Engineering',
    teacher: teachers.carter,
    period: 6,
    room: 'T-108',
    color: '#14b8a6',
    gradingModel: 'weighted_categories',
    markingPeriod: 'Q1 2025-26',
    categories: [
      { id: 'ce-proj', name: 'Design Projects', weight: 50 },
      { id: 'ce-quiz', name: 'Quizzes', weight: 25 },
      { id: 'ce-lab', name: 'Lab & Field', weight: 25 },
    ],
    assignments: [
      a('c-ce', 'Bridge Design Proposal', 'ce-proj', 48, 50, '2025-09-20'),
      a('c-ce', 'Materials Quiz', 'ce-quiz', 17, 20, '2025-09-11'),
      a('c-ce', 'Load Testing Lab', 'ce-lab', 23, 25, '2025-09-25'),
      a('c-ce', 'Structural Analysis Quiz', 'ce-quiz', 15, 20, '2025-10-02'),
      a('c-ce', 'Site Survey Field Work', 'ce-lab', 22, 25, '2025-10-09'),
      a('c-ce', 'Final Bridge Prototype', 'ce-proj', null, 100, '2025-11-05', 'upcoming'),
    ],
  },
  {
    id: 'c-span',
    name: 'Honors Spanish III',
    teacher: teachers.torres,
    period: 7,
    room: 'L-203',
    color: '#ec4899',
    gradingModel: 'weighted_categories',
    markingPeriod: 'Q1 2025-26',
    categories: [
      { id: 'sp-speak', name: 'Speaking', weight: 30 },
      { id: 'sp-write', name: 'Writing', weight: 25 },
      { id: 'sp-read', name: 'Reading', weight: 20 },
      { id: 'sp-listen', name: 'Listening', weight: 15 },
      { id: 'sp-cult', name: 'Culture', weight: 10 },
    ],
    assignments: [
      a('c-span', 'Oral Presentation: Mi Familia', 'sp-speak', 27, 30, '2025-09-18'),
      a('c-span', 'Ensayo: Vacaciones', 'sp-write', 22, 25, '2025-09-25'),
      a('c-span', 'Reading Comprehension 1', 'sp-read', 18, 20, '2025-09-12'),
      a('c-span', 'Listening Practice A', 'sp-listen', 13, 15, '2025-09-15'),
      a('c-span', 'Culture Project: Día de los Muertos', 'sp-cult', 9, 10, '2025-10-01'),
      a('c-span', 'Conversación Midterm', 'sp-speak', null, 40, '2025-10-22', 'upcoming'),
      a('c-span', 'Composition 2', 'sp-write', null, 25, '2025-10-15', 'upcoming'),
    ],
  },
];

export const DEMO_SCHEDULE: ScheduleEntry[] = DEMO_COURSES.map((c) => ({
  id: `sch-${c.id}`,
  courseId: c.id,
  courseName: c.name,
  teacherName: c.teacher.name,
  period: c.period,
  room: c.room || 'TBD',
  startTime: periodToTime(c.period as number).start,
  endTime: periodToTime(c.period as number).end,
  days: ['M', 'T', 'W', 'Th', 'F'],
  semester: 1,
}));

function periodToTime(p: number): { start: string; end: string } {
  const starts = ['08:00', '09:00', '10:00', '11:00', '12:30', '13:30', '14:30'];
  const ends = ['08:50', '09:50', '10:50', '11:50', '13:20', '14:20', '15:20'];
  const i = Math.max(0, Math.min(6, (p as number) - 1));
  return { start: starts[i], end: ends[i] };
}

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att1', date: '2025-09-05', status: 'present' },
  { id: 'att2', date: '2025-09-08', status: 'tardy', courseName: 'Honors Chemistry', reason: 'Late bus' },
  { id: 'att3', date: '2025-09-12', status: 'present' },
  { id: 'att4', date: '2025-09-19', status: 'excused', reason: 'Medical appointment' },
  { id: 'att5', date: '2025-09-22', status: 'present' },
  { id: 'att6', date: '2025-09-26', status: 'present' },
  { id: 'att7', date: '2025-10-01', status: 'present' },
  { id: 'att8', date: '2025-10-03', status: 'absent', courseName: 'AP English Language', reason: 'Unexcused' },
  { id: 'att9', date: '2025-10-06', status: 'present' },
  { id: 'att10', date: '2025-10-08', status: 'present' },
];

/** Deep clone helper so mutations never touch the original fixtures */
export function cloneDemoCourses(): Course[] {
  return JSON.parse(JSON.stringify(DEMO_COURSES));
}
