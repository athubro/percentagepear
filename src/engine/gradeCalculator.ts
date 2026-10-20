/**
 * PercentagePear Grade Calculation Engine
 * Supports total-points and weighted-category models.
 * All intermediate math uses full precision; rounding only for display.
 */

import type {
  Assignment,
  Course,
  CalculatedGrade,
  LetterGrade,
  TargetGradeResult,
  GradingModel,
} from '../types';

/** Standard letter grade thresholds (common in many US high schools). Adjustable. */
export const LETTER_THRESHOLDS: { min: number; letter: LetterGrade }[] = [
  { min: 89.5, letter: 'A' },
  { min: 79.5, letter: 'B' },
  { min: 69.5, letter: 'C' },
  { min: 59.5, letter: 'D' },
  { min: 0, letter: 'E' },
];

export function percentageToLetter(pct: number | null | undefined): LetterGrade {
  if (pct == null || Number.isNaN(pct)) return 'N/A';
  for (const t of LETTER_THRESHOLDS) {
    if (pct >= t.min) return t.letter;
  }
  return 'E';
}

export function letterToMidpoint(letter: LetterGrade): number {
  switch (letter) {
    case 'A': return 95;
    case 'B': return 85;
    case 'C': return 75;
    case 'D': return 65;
    case 'E':
    case 'F': return 50;
    default: return 0;
  }
}

// function isScored(_a: Assignment): boolean {
//   return false;
// }

function isExtraCredit(a: Assignment): boolean {
  return !!a.extraCredit || (a.pointsPossible === 0 && a.score != null && a.score > 0);
}

/**
 * Calculate grade for a single course given its assignments (including hypotheticals).
 */
export function calculateCourseGrade(
  course: Course,
  assignmentsOverride?: Assignment[]
): CalculatedGrade {
  const assignments = assignmentsOverride ?? course.assignments;
  const warnings: string[] = [];
  const model: GradingModel = course.gradingModel || 'weighted_categories';

  if (model === 'total_points') {
    return calculateTotalPoints(course, assignments, warnings);
  }
  return calculateWeighted(course, assignments, warnings);
}

function calculateTotalPoints(
  _course: Course,
  assignments: Assignment[],
  warnings: string[]
): CalculatedGrade {
  let earned = 0;
  let possible = 0;

  for (const a of assignments) {
    if (a.status === 'excused') continue;
    if (isExtraCredit(a)) {
      earned += a.score ?? 0;
      continue;
    }
    if (a.score === null) {
      // Missing treated as zero unless status is upcoming
      if (a.status === 'missing' || a.status === 'incomplete') {
        possible += a.pointsPossible;
        // earned stays 0
      }
      // upcoming ignored
      continue;
    }
    earned += a.score;
    possible += a.pointsPossible;
  }

  const percentage = possible > 0 ? (earned / possible) * 100 : 0;
  if (possible === 0) warnings.push('No graded assignments with points.');

  return {
    percentage,
    letter: percentageToLetter(percentage),
    earnedPoints: earned,
    possiblePoints: possible,
    byCategory: [],
    method: 'total_points',
    warnings,
  };
}

function calculateWeighted(
  course: Course,
  assignments: Assignment[],
  warnings: string[]
): CalculatedGrade {
  const categories = course.categories.length
    ? course.categories
    : [{ id: 'default', name: 'All Work', weight: 100 }];

  // Validate weights
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.5) {
    warnings.push(`Category weights sum to ${totalWeight.toFixed(1)}% (expected 100%).`);
  }

  const byCategory: CalculatedGrade['byCategory'] = [];
  let weightedSum = 0;
  let totalActiveWeight = 0;

  for (const cat of categories) {
    const catAssignments = assignments.filter((a) => a.categoryId === cat.id);
    let earned = 0;
    let possible = 0;

    // Handle drop lowest if configured
    let scores: { earned: number; possible: number }[] = [];
    for (const a of catAssignments) {
      if (a.status === 'excused') continue;
      if (isExtraCredit(a)) {
        earned += a.score ?? 0;
        continue;
      }
      if (a.score === null) {
        if (a.status === 'missing' || a.status === 'incomplete') {
          scores.push({ earned: 0, possible: a.pointsPossible });
        }
        continue;
      }
      scores.push({ earned: a.score, possible: a.pointsPossible });
    }

    if (cat.dropLowest && cat.dropLowest > 0 && scores.length > cat.dropLowest) {
      scores.sort((x, y) => {
        const px = x.possible > 0 ? x.earned / x.possible : 0;
        const py = y.possible > 0 ? y.earned / y.possible : 0;
        return px - py;
      });
      scores = scores.slice(cat.dropLowest);
    }

    for (const s of scores) {
      earned += s.earned;
      possible += s.possible;
    }

    const catPct = possible > 0 ? (earned / possible) * 100 : 0;
    const contribution = possible > 0 ? (cat.weight / 100) * catPct : 0;

    if (possible > 0) {
      weightedSum += contribution;
      totalActiveWeight += cat.weight;
    } else if (catAssignments.some((a) => a.status !== 'upcoming')) {
      warnings.push(`Category "${cat.name}" has no scored assignments.`);
    }

    byCategory.push({
      categoryId: cat.id,
      name: cat.name,
      weight: cat.weight,
      earned,
      possible,
      percentage: catPct,
      contribution,
    });
  }

  // If some categories empty, renormalize active weight or leave as-is
  let percentage = 0;
  if (totalActiveWeight > 0) {
    // Scale so that empty categories do not drag the grade down
    percentage = (weightedSum / (totalActiveWeight / 100));
  }

  return {
    percentage,
    letter: percentageToLetter(percentage),
    earnedPoints: byCategory.reduce((s, c) => s + c.earned, 0),
    possiblePoints: byCategory.reduce((s, c) => s + c.possible, 0),
    byCategory,
    method: 'weighted_categories',
    warnings,
  };
}

/**
 * Apply simulation overlay (hypotheticals + score overrides) onto a course's assignments.
 */
export function applySimulation(
  course: Course,
  hypotheticals: Assignment[],
  modifiedScores: Record<string, number | null>
): Assignment[] {
  const base = course.assignments.map((a) => {
    if (a.id in modifiedScores) {
      return {
        ...a,
        score: modifiedScores[a.id],
        status: (modifiedScores[a.id] === null ? 'missing' : 'graded') as Assignment['status'],
        isHypothetical: a.isHypothetical,
      };
    }
    return { ...a };
  });
  return [...base, ...hypotheticals];
}

/**
 * Compute original (official/demo baseline) vs projected grade.
 */
export function compareGrades(course: Course, simulatedAssignments: Assignment[]) {
  const original = calculateCourseGrade(course, course.assignments.filter((a) => !a.isHypothetical));
  const projected = calculateCourseGrade(course, simulatedAssignments);
  return {
    original,
    projected,
    delta: projected.percentage - original.percentage,
  };
}

/**
 * Target grade calculator: what score is needed on a future assignment of given points.
 */
export function calculateRequiredScore(
  course: Course,
  currentAssignments: Assignment[],
  targetPct: number,
  futurePointsPossible: number,
  categoryId?: string
): TargetGradeResult {
  const assumptions: string[] = [];
  const current = calculateCourseGrade(course, currentAssignments);
  const targetLetter = percentageToLetter(targetPct);

  if (futurePointsPossible <= 0) {
    return {
      targetPercentage: targetPct,
      targetLetter,
      requiredScore: null,
      requiredPercentage: null,
      pointsPossible: futurePointsPossible,
      achievable: false,
      message: 'Future assignment must have positive point value.',
      assumptions,
    };
  }

  if (course.gradingModel === 'total_points') {
    const earned = current.earnedPoints;
    const possible = current.possiblePoints;
    // (earned + x) / (possible + future) * 100 = target
    // earned + x = target/100 * (possible + future)
    // x = target/100 * (possible + future) - earned
    const needed = (targetPct / 100) * (possible + futurePointsPossible) - earned;
    const achievable = needed <= futurePointsPossible + 0.001; // allow tiny float error
    const req = Math.max(0, needed);
    assumptions.push('Total-points model; missing assignments currently treated as zero.');
    return {
      targetPercentage: targetPct,
      targetLetter,
      requiredScore: Math.round(req * 100) / 100,
      requiredPercentage: (req / futurePointsPossible) * 100,
      pointsPossible: futurePointsPossible,
      achievable,
      message: achievable
        ? `You need approximately ${req.toFixed(1)} / ${futurePointsPossible} points (${((req / futurePointsPossible) * 100).toFixed(1)}%).`
        : `Even a perfect score yields less than the target.`,
      assumptions,
    };
  }

  // Weighted model – simplified: assume the future assignment is added to a specific category
  // or the largest-weight category if unspecified.
  const cats = course.categories.length ? course.categories : [{ id: 'default', name: 'All', weight: 100 }];
  const targetCat =
    cats.find((c) => c.id === categoryId) ||
    cats.reduce((a, b) => (a.weight >= b.weight ? a : b));

  assumptions.push(
    `Assumes the future assignment belongs to category "${targetCat.name}" (${targetCat.weight}%).`
  );
  assumptions.push('Empty categories are renormalized out of the average.');

  // Rebuild current category stats
  const currentGrade = calculateCourseGrade(course, currentAssignments);
  const catStat = currentGrade.byCategory.find((c) => c.categoryId === targetCat.id) || {
    earned: 0,
    possible: 0,
    weight: targetCat.weight,
    percentage: 0,
    contribution: 0,
    name: targetCat.name,
    categoryId: targetCat.id,
  };

  // We need the overall percentage to become targetPct after adding the assignment.
  // This requires solving for the new category percentage, then for the score.
  // Let W = sum of active weights of other categories, C = this category weight.
  // Overall = (sum other contributions + C * newCatPct) / totalActive
  // For simplicity we assume all other categories stay the same and this cat becomes active.

  const otherContribution = currentGrade.byCategory
    .filter((c) => c.categoryId !== targetCat.id && c.possible > 0)
    .reduce((s, c) => s + c.contribution, 0);
  const otherWeight = currentGrade.byCategory
    .filter((c) => c.categoryId !== targetCat.id && c.possible > 0)
    .reduce((s, c) => s + c.weight, 0);

  const newPossible = catStat.possible + futurePointsPossible;
  // We want: (otherContribution + (weight/100)*newCatPct) / ((otherWeight + weight)/100) = target
  // => otherContribution + (w/100)*newCatPct = target * (otherWeight + w)/100
  // => (w/100)*newCatPct = target*(otherW+w)/100 - otherC
  // => newCatPct = (target*(otherW+w)/100 - otherC) * 100 / w

  const w = targetCat.weight;
  const neededCatPct =
    ((targetPct * (otherWeight + w)) / 100 - otherContribution) * (100 / w);

  // newCatPct = (catStat.earned + x) / newPossible * 100
  // x = neededCatPct/100 * newPossible - catStat.earned
  const neededScore = (neededCatPct / 100) * newPossible - catStat.earned;
  const achievable = neededScore <= futurePointsPossible + 0.01 && neededScore >= -0.01;
  const req = Math.max(0, Math.min(futurePointsPossible * 1.1, neededScore)); // allow mild extra credit

  return {
    targetPercentage: targetPct,
    targetLetter,
    requiredScore: Math.round(req * 100) / 100,
    requiredPercentage: (req / futurePointsPossible) * 100,
    pointsPossible: futurePointsPossible,
    achievable: neededScore <= futurePointsPossible + 0.5,
    message: achievable
      ? `You need approximately ${req.toFixed(1)} / ${futurePointsPossible} on the future assignment.`
      : `Target may not be reachable with this assignment size under current category weights.`,
    assumptions,
  };
}

/** Round for display only */
export function formatGrade(pct: number, decimals = 1): string {
  return pct.toFixed(decimals);
}
