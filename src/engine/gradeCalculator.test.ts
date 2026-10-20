import { describe, it, expect } from 'vitest'
import {
  calculateCourseGrade,
  calculateRequiredScore,
  applySimulation,
  percentageToLetter,
  formatGrade,
} from './gradeCalculator'
import type { Course, Assignment } from '../types'

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'Test Course',
    teacher: { id: 't1', name: 'Teacher' },
    period: 1,
    color: '#000',
    gradingModel: 'weighted_categories',
    categories: [
      { id: 'tests', name: 'Tests', weight: 60 },
      { id: 'hw', name: 'Homework', weight: 40 },
    ],
    assignments: [],
    ...overrides,
  }
}

function asg(
  id: string,
  cat: string,
  score: number | null,
  pts: number,
  status: Assignment['status'] = score != null ? 'graded' : 'upcoming'
): Assignment {
  return {
    id,
    courseId: 'c1',
    name: id,
    categoryId: cat,
    score,
    pointsPossible: pts,
    dueDate: '2025-10-01',
    status,
    isHypothetical: false,
  }
}

describe('percentageToLetter', () => {
  it('maps standard thresholds', () => {
    expect(percentageToLetter(95)).toBe('A')
    expect(percentageToLetter(89.5)).toBe('A')
    expect(percentageToLetter(85)).toBe('B')
    expect(percentageToLetter(70)).toBe('C')
    expect(percentageToLetter(60)).toBe('D')
    expect(percentageToLetter(50)).toBe('E')
    expect(percentageToLetter(null)).toBe('N/A')
  })
})

describe('total points', () => {
  it('calculates simple average', () => {
    const course = makeCourse({
      gradingModel: 'total_points',
      categories: [{ id: 'all', name: 'All', weight: 100 }],
      assignments: [asg('a1', 'all', 80, 100), asg('a2', 'all', 90, 100)],
    })
    const g = calculateCourseGrade(course)
    expect(g.percentage).toBeCloseTo(85, 5)
    expect(g.letter).toBe('B')
    expect(g.earnedPoints).toBe(170)
    expect(g.possiblePoints).toBe(200)
  })

  it('treats missing as zero', () => {
    const course = makeCourse({
      gradingModel: 'total_points',
      categories: [{ id: 'all', name: 'All', weight: 100 }],
      assignments: [asg('a1', 'all', 100, 100), asg('a2', 'all', null, 100, 'missing')],
    })
    const g = calculateCourseGrade(course)
    expect(g.percentage).toBeCloseTo(50, 5)
  })
})

describe('weighted categories', () => {
  it('weights categories correctly', () => {
    const course = makeCourse({
      assignments: [
        asg('t1', 'tests', 90, 100),
        asg('h1', 'hw', 50, 100),
      ],
    })
    // 0.6*90 + 0.4*50 = 54+20 = 74
    const g = calculateCourseGrade(course)
    expect(g.percentage).toBeCloseTo(74, 5)
    expect(g.byCategory).toHaveLength(2)
  })

  it('renormalizes empty categories', () => {
    const course = makeCourse({
      assignments: [asg('t1', 'tests', 80, 100)],
    })
    // only tests active → should be 80, not 48
    const g = calculateCourseGrade(course)
    expect(g.percentage).toBeCloseTo(80, 5)
  })
})

describe('simulation overlay', () => {
  it('applies score overrides and hypotheticals', () => {
    const course = makeCourse({
      gradingModel: 'total_points',
      categories: [{ id: 'all', name: 'All', weight: 100 }],
      assignments: [asg('a1', 'all', 50, 100)],
    })
    const hyp: Assignment = {
      id: 'h1',
      courseId: 'c1',
      name: 'Final',
      categoryId: 'all',
      score: 100,
      pointsPossible: 100,
      dueDate: '2025-12-01',
      status: 'hypothetical',
      isHypothetical: true,
    }
    const sim = applySimulation(course, [hyp], { a1: 80 })
    const g = calculateCourseGrade(course, sim)
    expect(g.percentage).toBeCloseTo(90, 5)
  })
})

describe('target calculator', () => {
  it('computes required score for total points', () => {
    const course = makeCourse({
      gradingModel: 'total_points',
      categories: [{ id: 'all', name: 'All', weight: 100 }],
      assignments: [asg('a1', 'all', 80, 100)],
    })
    const result = calculateRequiredScore(course, course.assignments, 90, 100)
    // (80 + x) / 200 = 0.9 → x = 100
    expect(result.requiredScore).toBeCloseTo(100, 1)
    expect(result.achievable).toBe(true)
  })
})

describe('formatGrade', () => {
  it('formats decimals', () => {
    expect(formatGrade(86.456, 1)).toBe('86.5')
    expect(formatGrade(86.456, 0)).toBe('86')
  })
})
