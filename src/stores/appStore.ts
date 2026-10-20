import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuid } from 'uuid';
import type {
  AppMode,
  AppPreferences,
  Course,
  Assignment,
  SimulationScenario,
  StudentInfo,
  ScheduleEntry,
  AttendanceRecord,
  CalculatedGrade,
} from '../types';
import {
  DEMO_STUDENT,
  cloneDemoCourses,
  DEMO_SCHEDULE,
  DEMO_ATTENDANCE,
} from '../data/demoData';
import {
  calculateCourseGrade,
  applySimulation,
  compareGrades,
  percentageToLetter,
} from '../engine/gradeCalculator';
import { connectStudentVue, MCPS_HOST, type SvueCredentials } from '../api/studentvue';

const STORAGE_KEY = 'percentagepear-state-v1';

interface PersistedState {
  mode: AppMode;
  preferences: AppPreferences;
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
  demoCourses: Course[] | null;
}

/** Force a new array reference so Vue recomputes dependents */
function touchScenarios(
  list: SimulationScenario[],
  id: string,
  updater: (s: SimulationScenario) => SimulationScenario
): SimulationScenario[] {
  return list.map((s) => (s.id === id ? updater({ ...s }) : s));
}

export const useAppStore = defineStore('app', () => {
  const mode = ref<AppMode>('guest');
  const student = ref<StudentInfo | null>(DEMO_STUDENT);
  const courses = ref<Course[]>(cloneDemoCourses());
  const schedule = ref<ScheduleEntry[]>([...DEMO_SCHEDULE]);
  const attendance = ref<AttendanceRecord[]>([...DEMO_ATTENDANCE]);
  const scenarios = ref<SimulationScenario[]>([]);
  const activeScenarioId = ref<string | null>(null);
  /** Bump this whenever simulation data changes so computed grades always refresh */
  const simVersion = ref(0);
  const isDemo = computed(() => mode.value === 'guest');
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(new Date().toISOString());
  const connectionHost = ref(MCPS_HOST);

  const preferences = ref<AppPreferences>({
    theme: 'system',
    gradeRounding: 1,
    showLetterGrades: true,
    defaultTargetLetter: 'A',
  });

  function bumpSim() {
    simVersion.value += 1;
  }

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: PersistedState = JSON.parse(raw);
      if (data.mode === 'guest') mode.value = 'guest';
      if (data.preferences) preferences.value = { ...preferences.value, ...data.preferences };
      if (data.scenarios) scenarios.value = data.scenarios;
      if (data.activeScenarioId) activeScenarioId.value = data.activeScenarioId;
      if (data.demoCourses && mode.value === 'guest') {
        courses.value = data.demoCourses;
      }
    } catch (e) {
      console.warn('Failed to load persisted state', e);
    }
  }

  function persist() {
    const data: PersistedState = {
      mode: mode.value === 'studentvue' ? 'guest' : mode.value, // don't persist live session as default
      preferences: preferences.value,
      scenarios: scenarios.value,
      activeScenarioId: activeScenarioId.value,
      demoCourses: mode.value === 'guest' ? courses.value : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function enterGuestMode() {
    mode.value = 'guest';
    student.value = DEMO_STUDENT;
    courses.value = cloneDemoCourses();
    schedule.value = [...DEMO_SCHEDULE];
    attendance.value = [...DEMO_ATTENDANCE];
    scenarios.value = [];
    activeScenarioId.value = null;
    error.value = null;
    lastUpdated.value = new Date().toISOString();
    bumpSim();
    persist();
  }

  function resetDemo() {
    if (mode.value !== 'guest') return;
    courses.value = cloneDemoCourses();
    scenarios.value = [];
    activeScenarioId.value = null;
    bumpSim();
    persist();
  }

  function getCourse(id: string) {
    return courses.value.find((c) => c.id === id);
  }

  function getActiveSimulation(courseId: string): SimulationScenario | null {
    if (!activeScenarioId.value) return null;
    const s = scenarios.value.find((x) => x.id === activeScenarioId.value);
    return s && s.courseId === courseId ? s : null;
  }

  function ensureScenario(courseId: string, name = 'Quick Simulation'): SimulationScenario {
    let scenario = getActiveSimulation(courseId);
    if (scenario) return scenario;
    // Prefer an existing scenario for this course
    scenario = scenarios.value.find((s) => s.courseId === courseId) || null;
    if (scenario) {
      activeScenarioId.value = scenario.id;
      return scenario;
    }
    return createScenario(courseId, name)!;
  }

  function getCourseGrade(courseId: string): CalculatedGrade | null {
    void simVersion.value; // reactive dependency
    const course = getCourse(courseId);
    if (!course) return null;
    const sim = getActiveSimulation(courseId);
    if (sim) {
      const simulated = applySimulation(course, sim.hypotheticalAssignments, sim.modifiedScores);
      return calculateCourseGrade(course, simulated);
    }
    return calculateCourseGrade(course);
  }

  function getGradeComparison(courseId: string) {
    void simVersion.value;
    const course = getCourse(courseId);
    if (!course) return null;
    const sim = getActiveSimulation(courseId);
    const simulated = sim
      ? applySimulation(course, sim.hypotheticalAssignments, sim.modifiedScores)
      : course.assignments.filter((a) => !a.isHypothetical);
    return compareGrades(course, simulated);
  }

  function createScenario(courseId: string, name: string) {
    const course = getCourse(courseId);
    if (!course) return null;
    const baseline = calculateCourseGrade(course);
    const scenario: SimulationScenario = {
      id: uuid(),
      name,
      courseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      baselineSnapshot: {
        grade: baseline.percentage,
        letter: baseline.letter,
        assignments: JSON.parse(
          JSON.stringify(course.assignments.filter((a) => !a.isHypothetical))
        ),
      },
      hypotheticalAssignments: [],
      modifiedScores: {},
    };
    scenarios.value = [...scenarios.value, scenario];
    activeScenarioId.value = scenario.id;
    bumpSim();
    persist();
    return scenario;
  }

  function setActiveScenario(id: string | null) {
    activeScenarioId.value = id;
    bumpSim();
    persist();
  }

  function updateScenario(id: string, patch: Partial<SimulationScenario>) {
    scenarios.value = touchScenarios(scenarios.value, id, (s) => ({
      ...s,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
    bumpSim();
    persist();
  }

  function deleteScenario(id: string) {
    scenarios.value = scenarios.value.filter((s) => s.id !== id);
    if (activeScenarioId.value === id) activeScenarioId.value = null;
    bumpSim();
    persist();
  }

  function duplicateScenario(id: string) {
    const src = scenarios.value.find((s) => s.id === id);
    if (!src) return null;
    const copy: SimulationScenario = {
      ...JSON.parse(JSON.stringify(src)),
      id: uuid(),
      name: `${src.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    scenarios.value = [...scenarios.value, copy];
    bumpSim();
    persist();
    return copy;
  }

  function addHypothetical(
    courseId: string,
    data: {
      name: string;
      categoryId: string;
      pointsPossible: number;
      score: number | null;
      dueDate?: string;
    }
  ) {
    const scenario = ensureScenario(courseId);
    const assignment: Assignment = {
      id: uuid(),
      courseId,
      name: data.name,
      categoryId: data.categoryId,
      score: data.score,
      pointsPossible: data.pointsPossible,
      dueDate: data.dueDate || new Date().toISOString().slice(0, 10),
      status: data.score == null ? 'upcoming' : 'hypothetical',
      isHypothetical: true,
    };
    scenarios.value = touchScenarios(scenarios.value, scenario.id, (s) => ({
      ...s,
      hypotheticalAssignments: [...s.hypotheticalAssignments, assignment],
      updatedAt: new Date().toISOString(),
    }));
    activeScenarioId.value = scenario.id;
    bumpSim();
    persist();
    return assignment;
  }

  /** Edit score on any assignment (official or hyp) — always creates/uses a scenario */
  function updateHypotheticalScore(courseId: string, assignmentId: string, score: number | null) {
    const scenario = ensureScenario(courseId);
    scenarios.value = touchScenarios(scenarios.value, scenario.id, (s) => {
      const hypIdx = s.hypotheticalAssignments.findIndex((a) => a.id === assignmentId);
      if (hypIdx >= 0) {
        const hyps = s.hypotheticalAssignments.map((a, i) =>
          i === hypIdx
            ? {
                ...a,
                score,
                status: (score == null ? 'upcoming' : 'hypothetical') as Assignment['status'],
              }
            : a
        );
        return { ...s, hypotheticalAssignments: hyps, updatedAt: new Date().toISOString() };
      }
      return {
        ...s,
        modifiedScores: { ...s.modifiedScores, [assignmentId]: score },
        updatedAt: new Date().toISOString(),
      };
    });
    activeScenarioId.value = scenario.id;
    bumpSim();
    persist();
  }

  function deleteHypothetical(courseId: string, assignmentId: string) {
    const scenario = getActiveSimulation(courseId);
    if (!scenario) return;
    scenarios.value = touchScenarios(scenarios.value, scenario.id, (s) => {
      const modifiedScores = { ...s.modifiedScores };
      delete modifiedScores[assignmentId];
      return {
        ...s,
        hypotheticalAssignments: s.hypotheticalAssignments.filter((a) => a.id !== assignmentId),
        modifiedScores,
        updatedAt: new Date().toISOString(),
      };
    });
    bumpSim();
    persist();
  }

  function resetSimulation(courseId: string) {
    const scenario = getActiveSimulation(courseId);
    if (!scenario) return;
    scenarios.value = touchScenarios(scenarios.value, scenario.id, (s) => ({
      ...s,
      hypotheticalAssignments: [],
      modifiedScores: {},
      updatedAt: new Date().toISOString(),
    }));
    bumpSim();
    persist();
  }

  function getSimulatedAssignments(courseId: string): Assignment[] {
    void simVersion.value;
    const course = getCourse(courseId);
    if (!course) return [];
    const sim = getActiveSimulation(courseId);
    if (!sim) return course.assignments;
    return applySimulation(course, sim.hypotheticalAssignments, sim.modifiedScores);
  }

  async function loginStudentVue(username: string, password: string, host = MCPS_HOST) {
    loading.value = true;
    error.value = null;
    try {
      const creds: SvueCredentials = {
        username: username.trim(),
        password,
        host: host.replace(/^https?:\/\//, '').replace(/\/$/, '') || MCPS_HOST,
        useGrademelonProxy: false, // set below
      };
      const anyStore = globalThis as any;
      creds.useGrademelonProxy = !!(anyStore.__ppUseGmProxy);
      const session = await connectStudentVue(creds);
      mode.value = 'studentvue';
      student.value = session.student;
      courses.value = session.courses;
      schedule.value = session.schedule.length ? session.schedule : [];
      attendance.value = session.attendance;
      scenarios.value = [];
      activeScenarioId.value = null;
      connectionHost.value = creds.host;
      lastUpdated.value = new Date().toISOString();
      if ((session as any).debug) {
        error.value = (session as any).debug; // non-fatal notice
      }
      bumpSim();
      // Do not persist password
      return session;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function logoutStudentVue() {
    enterGuestMode();
  }

  function applyTheme() {
    const t = preferences.value.theme;
    const dark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }

  function setTheme(theme: AppPreferences['theme']) {
    preferences.value.theme = theme;
    applyTheme();
    persist();
  }

  loadPersisted();
  if (mode.value === 'guest' && courses.value.length === 0) {
    enterGuestMode();
  }

  return {
    mode,
    student,
    courses,
    schedule,
    attendance,
    scenarios,
    activeScenarioId,
    simVersion,
    isDemo,
    loading,
    error,
    lastUpdated,
    connectionHost,
    preferences,
    enterGuestMode,
    resetDemo,
    getCourse,
    getCourseGrade,
    getGradeComparison,
    getActiveSimulation,
    createScenario,
    setActiveScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    addHypothetical,
    updateHypotheticalScore,
    deleteHypothetical,
    resetSimulation,
    getSimulatedAssignments,
    loginStudentVue,
    logoutStudentVue,
    applyTheme,
    setTheme,
    persist,
    percentageToLetter,
  };
});
