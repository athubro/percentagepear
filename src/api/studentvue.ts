
/**
 * StudentVUE client — matches www.grademelon.org mobile JSON flow.
 *
 * Updated for GitHub Pages deployment:
 * - Uses corsproxy.io as a CORS proxy instead of a local dev-server proxy.
 *
 * Critical for MCPS Synergy 2027:
 * - Header `edupointkeyversion` = AES-256-CBC of MMDDYY|9.0.0|MMDDYY|android
 * - Key: b2524efb438b4532b322e633d5aff252  IV: "AES" + zero pad
 * - AttemptLogin body includes userID/password (not null)
 * - userType: "Student"
 */

import type {
  Assignment,
  Course,
  GradingCategory,
  ScheduleEntry,
  StudentInfo,
  AttendanceRecord,
  AssignmentStatus,
} from '../types'

export const MCPS_HOST = 'md-mcps-psv.edupoint.com'
const API = '/api/v1/mobile/PXPWebServices'

/* ── CORS proxy config ─────────────────────────────────────────────── */
// Try multiple reliable CORS proxies for better resilience
const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://runkit.io/3kh0/cors-proxy/branches/master?url=',
]

/**
 * Build the full proxied URL for a given host + path.
 * In dev, always use the local proxy. In prod, try the first proxy.
 */
function buildUrl(host: string, path: string): string {
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '::1' ||
     window.location.port === '5173' ||
     window.location.port === '4173')

  if (isLocal) {
    // Local dev-server proxy (original behaviour)
    return `/svue-proxy${path}`
  }
  // Production: route through CORS proxy
  const target = `https://${host}${path}`
  return `${PROXIES[0]}${encodeURIComponent(target)}`
}
/* ─────────────────────────────────────────────────────────────────── */

const COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f59e0b', '#14b8a6', '#ec4899', '#6366f1',
]

export interface SvueCredentials {
  username: string
  password: string
  host: string
  useGrademelonProxy?: boolean
}

export interface SvueSession {
  credentials: SvueCredentials
  accessToken?: string
  student: StudentInfo
  courses: Course[]
  schedule: ScheduleEntry[]
  attendance: AttendanceRecord[]
  debug?: string
  method?: string
}

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function strToBase64(value: string): string {
  return toBase64(new TextEncoder().encode(value))
}

/** Same edupointkeyversion algorithm used by Grademelon (www.grademelon.org) */
async function edupointKeyVersion(): Promise<string> {
  const d = new Date()
  const n =
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    String(d.getFullYear()).slice(-2)
  const plaintext = `${n}|9.0.0|${n}|android`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('b2524efb438b4532b322e633d5aff252'),
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  )
  const iv = new Uint8Array(16)
  iv.set(new TextEncoder().encode('AES')) // AES + zero pad

  const ct = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  return toBase64(new Uint8Array(ct))
}

/* ── The host is threaded through so buildUrl can construct the target ── */
let _currentHost = MCPS_HOST

async function mobileFetch(
  method: string,
  inner: Record<string, unknown>,
  authorization: string
): Promise<any> {
  const keyver = await edupointKeyVersion()
  const url = buildUrl(_currentHost, `${API}/${method}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'User-Agent': 'ksoap',
      edupointkeyversion: keyver,
      Authorization: authorization,
    },
    body: JSON.stringify({
      arguments: { request: JSON.stringify(inner) },
    }),
  })

  const text = await res.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(
      `StudentVUE returned non-JSON (HTTP ${res.status}). ` +
      `If running locally, ensure "npm run dev" is running. ` +
      `If deployed, the CORS proxy may be down or blocking the request.`
    )
  }

  const errMsg = String(json?.error?.message || json?.Message || '')
  if (/UPD5304|update app|new version/i.test(errMsg)) {
    throw new Error(
      `MCPS still requires an official app version (${errMsg}). If this persists after a refresh, the district key may have rotated.`
    )
  }
  if (/D5518|deprecated/i.test(errMsg)) {
    throw new Error(`Legacy API blocked: ${errMsg}`)
  }

  return json
}

async function login(creds: SvueCredentials): Promise<{ access: string; refresh?: string }> {
  _currentHost = creds.host
  const json = await mobileFetch(
    'AttemptLogin',
    {
      userID: creds.username,
      password: creds.password,
      userType: 'Student',
    },
    `Basic ${strToBase64(`${creds.username}:${creds.password}`)}`
  )

  if (json?.access_token) {
    return { access: String(json.access_token), refresh: json.refresh_token }
  }
  if (json?.error?.code === '401' || /invalid user/i.test(json?.error?.message || '')) {
    throw new Error('Invalid Student ID or password')
  }
  throw new Error(json?.error?.message || 'Login failed — no access token')
}

async function api(
  creds: SvueCredentials,
  token: string,
  method: string,
  inner: Record<string, unknown>
): Promise<any> {
  _currentHost = creds.host
  let json = await mobileFetch(method, inner, `Bearer ${token}`)
  if (json?.error?.code === '401') {
    const t = await login(creds)
    json = await mobileFetch(method, inner, `Bearer ${t.access}`)
  }
  if (json?.error) {
    if (json.error.code === '2100') return null
    if (json.error.code === '401') throw new Error('Invalid Student ID or password')
    throw new Error(json.error.message || `Error ${json.error.code}`)
  }
  return json?.data ?? null
}

function mapStatus(score: unknown, notes: string): AssignmentStatus {
  const n = (notes || '').toLowerCase()
  if (n.includes('missing')) return 'missing'
  if (n.includes('late')) return 'late'
  if (n.includes('excused') || n.includes('exempt')) return 'excused'
  if (score == null || score === '' || score === '*') return 'upcoming'
  return 'graded'
}

function finiteNum(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : undefined
}

/** Earned score from the `score` field (not the denominator). */
function parseScore(raw: unknown): number | null {
  if (raw == null || raw === '' || raw === '*') return null
  const s = String(raw).replace(/%/g, '').trim()
  const m = /^([\d.]+)/.exec(s)
  if (m) {
    const n = parseFloat(m[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Points possible — match parentvue / Grademelon.
 * MCPS often sends `points: "28.000 / 30.000"` (earned / possible).
 * Never use parseFloat(points) alone — that returns the numerator.
 */
function parsePointsPossible(a: any): number {
  const candidates: (number | undefined)[] = []

  candidates.push(finiteNum(a.pointPossible))
  candidates.push(finiteNum(a.PointsPossible))
  candidates.push(finiteNum(a.point))

  const pointsRaw = a.points != null ? String(a.points).trim() : ''
  if (pointsRaw) {
    const denom = /\/\s*([\d.]+)\s*$/.exec(pointsRaw)
    if (denom) candidates.push(finiteNum(denom[1]))
    else {
      const only = /^\s*([\d.]+)/.exec(pointsRaw)
      if (only) candidates.push(finiteNum(only[1]))
    }
  }

  const display = a.displayScore != null ? String(a.displayScore) : ''
  if (display) {
    const m = /(?:\/|\bout\s+of\b)\s*([\d.]+)\s*$/i.exec(display)
    if (m) candidates.push(finiteNum(m[1]))
  }

  const scoreStr = a.score != null ? String(a.score) : ''
  if (scoreStr.includes('/')) {
    const m = /\/\s*([\d.]+)\s*$/.exec(scoreStr)
    if (m) candidates.push(finiteNum(m[1]))
  }

  const scoreType = a.scoreType != null ? String(a.scoreType) : ''
  if (scoreType) {
    const m = /rubric\D*[\d.]+\s*(?:-|–|to)\s*([\d.]+)/i.exec(scoreType)
    if (m) candidates.push(finiteNum(m[1]))
  }

  const positive = candidates.find((n) => n !== undefined && n > 0)
  if (positive !== undefined) return positive
  const any = candidates.find((n) => n !== undefined)
  return any ?? 0
}

function parseGradebook(data: any): Course[] {
  if (!data) return []
  const gb = data.traditionalGradebook || data.standardsGradebook || data
  const courseList = gb?.courses
  if (!Array.isArray(courseList)) return []

  return courseList.map((c: any, idx: number) => {
    const title = String(c.title || c.courseName || `Course ${idx + 1}`)
      .replace(/\(.*\)/, '')
      .trim()
    const marks = Array.isArray(c.marks) ? c.marks : []
    const mark =
      marks.find((m: any) => Array.isArray(m.assignments) && m.assignments.length) ||
      marks[0] ||
      null

    const categories: GradingCategory[] = []
    const catMap = new Map<string, string>()
    let calcList: any[] = []
    const summary = mark?.gradeCalculationSummary
    if (Array.isArray(summary)) calcList = summary
    else if (Array.isArray(summary?.assignmentGradeCalc)) calcList = summary.assignmentGradeCalc

    calcList.forEach((calc: any, i: number) => {
      const name = String(calc.type || calc.name || `Category ${i + 1}`)
      let weight = parseFloat(String(calc.weight || '0')) || 0
      if (weight > 0 && weight <= 1) weight *= 100
      const id = `cat-${idx}-${i}`
      categories.push({ id, name, weight })
      catMap.set(name.toLowerCase(), id)
    })
    if (!categories.length) {
      categories.push({ id: `cat-${idx}-all`, name: 'All Assignments', weight: 100 })
    }

    const assignments: Assignment[] = (Array.isArray(mark?.assignments) ? mark.assignments : []).map(
      (a: any, ai: number) => {
        const name = String(a.measure || a.name || `Assignment ${ai + 1}`)
        const type = String(a.type || categories[0].name)
        const scoreRaw = a.score ?? a.Score ?? null
        let due = String(a.dueDate || a.date || '').slice(0, 10)
        due = due.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, (_, m, d, y) =>
          `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        )
        const pts = parsePointsPossible(a)
        return {
          id: `svue-${idx}-${ai}`,
          courseId: `svue-c-${idx}`,
          name,
          categoryId: catMap.get(type.toLowerCase()) || categories[0].id,
          score: parseScore(scoreRaw),
          pointsPossible: pts,
          dueDate: due || new Date().toISOString().slice(0, 10),
          status: mapStatus(scoreRaw, String(a.notes || '')),
          isHypothetical: false,
          notes: a.notes ? String(a.notes) : undefined,
        }
      }
    )

    const hasWeights = categories.some((cat) => cat.weight > 0 && Math.abs(cat.weight - 100) > 0.5)
    const rawGrade = mark?.calculatedScoreRaw
    const officialGrade = rawGrade != null && rawGrade !== '' ? parseFloat(String(rawGrade)) : null

    return {
      id: `svue-c-${idx}`,
      name: title,
      teacher: {
        id: `t-${idx}`,
        name: String(c.staff || c.teacher || 'Teacher'),
        email: c.staffEMail || undefined,
      },
      period: String(c.period ?? idx + 1),
      room: String(c.room || ''),
      color: COLORS[idx % COLORS.length],
      gradingModel: (hasWeights ? 'weighted_categories' : 'total_points') as Course['gradingModel'],
      categories,
      assignments,
      officialGrade: Number.isFinite(officialGrade as number) ? (officialGrade as number) : null,
      officialLetter: mark?.calculatedScoreString || undefined,
      markingPeriod: mark?.markName || undefined,
    }
  })
}

function parseSchedule(data: any): ScheduleEntry[] {
  const entries: ScheduleEntry[] = []
  if (!data) return entries
  const all = data.studentClassScheduleForAllTerms || data.studentClassSchedule || data
  const blocks = all?.studentClassScheduleForTerms
  const lists: any[] = []
  if (Array.isArray(blocks)) {
    for (const t of blocks) if (Array.isArray(t.classLists)) lists.push(...t.classLists)
  } else if (Array.isArray(all?.classLists)) lists.push(...all.classLists)
  lists.forEach((cl, i) => {
    entries.push({
      id: `sch-${i}`,
      courseId: `svue-c-${i}`,
      courseName: String(cl.courseTitle || cl.title || `Period ${i + 1}`),
      teacherName: String(cl.teacher || ''),
      period: String(cl.period ?? i + 1),
      room: String(cl.roomName || cl.room || ''),
      startTime: String(cl.startTime || ''),
      endTime: String(cl.endTime || ''),
      days: ['M', 'T', 'W', 'Th', 'F'],
    })
  })
  return entries
}

function normalizeDate(raw: string): string {
  const s = raw.trim()
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return s.slice(0, 10)
}

function attendanceStatus(text: string): AttendanceRecord['status'] {
  const code = text.toLowerCase()
  if (code.includes('tard')) return 'tardy'
  if (code.includes('unexcus')) return 'unexcused'
  if (code.includes('excus')) return 'excused'
  if (code.includes('present') || code === 'p') return 'present'
  if (code.includes('absent') || code.includes('absen') || code === 'a') return 'absent'
  return 'absent'
}

function collectObjects(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const item of node) collectObjects(item, out)
    return out
  }
  const obj = node as Record<string, unknown>
  out.push(obj)
  for (const v of Object.values(obj)) collectObjects(v, out)
  return out
}

function parseAttendance(data: unknown): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const seen = new Set<string>()
  for (const row of collectObjects(data)) {
    const dateRaw = String(
      row.absenceDate || row.AbsenceDate || row.date || row.Date || row.attDate || ''
    )
    if (!dateRaw || dateRaw === 'undefined') continue
    const reason = String(row.reason || row.Reason || row.note || row.Note || row.description || '')
    const code = String(row.attendanceCode || row.code || row.Code || row.status || reason)
    if (!code && !reason) continue
    const status = attendanceStatus(`${code} ${reason}`)
    const courseName = String(row.course || row.Course || row.courseTitle || row.periodName || '')
    const period = String(row.period || row.Period || '')
    const date = normalizeDate(dateRaw)
    const id = `${date}|${period}|${courseName}|${status}|${reason}`
    if (seen.has(id)) continue
    seen.add(id)
    records.push({
      id: `att-${records.length}`,
      date,
      status,
      reason: reason || undefined,
      courseName: courseName || undefined,
      period: period || undefined,
    })
  }
  return records
}

export async function connectStudentVue(creds: SvueCredentials): Promise<SvueSession> {
  const host = creds.host.replace(/^https?:\/\//, '').replace(/\/$/, '') || MCPS_HOST
  const normalized: SvueCredentials = {
    username: creds.username.trim(),
    password: creds.password,
    host,
  }

  const tokens = await login(normalized)

  let student: StudentInfo = {
    id: normalized.username,
    name: normalized.username,
    gradeLevel: 0,
    school: '',
    studentId: normalized.username,
  }

  try {
    const childData = await api(normalized, tokens.access, 'GetChildListData', {
      childIntID: 0,
      languageCode: 'en',
    })
    const list =
      childData?.children?.childInfos ||
      childData?.children?.childrenList ||
      childData?.children?.childList ||
      []
    if (Array.isArray(list) && list[0]) {
      const c = list[0]
      student = {
        id: String(c.childIntID ?? normalized.username),
        name: String(c.name || c.childName || normalized.username),
        gradeLevel: parseInt(String(c.grade || '0'), 10) || 0,
        school: String(c.schoolName || c.organizationName || ''),
        studentId: String(c.studentGU || normalized.username),
      }
    }
  } catch {
    /* keep defaults */
  }

  try {
    const info = await api(normalized, tokens.access, 'GetStudentInfoData', { childIntID: 0 })
    const detail = info?.studentInfoDetailXML || info?.studentInfoXML || {}
    const name =
      detail.FormattedName || [detail.FirstName, detail.LastName].filter(Boolean).join(' ')
    if (name) student = { ...student, name }
    if (detail.CurrentSchool || detail.SchoolName) {
      student = { ...student, school: String(detail.CurrentSchool || detail.SchoolName) }
    }
  } catch {
    /* optional */
  }

  const gbData = await api(normalized, tokens.access, 'Gradebook', {
    reportPeriod: '',
    concurrentSchOrgYearGU: '',
    childIntID: 0,
    languageCode: 'en',
  })
  let courses = parseGradebook(gbData)

  let schedule: ScheduleEntry[] = []
  try {
    const sch = await api(normalized, tokens.access, 'StudentClassList', {
      childIntID: 0,
      loadAllTerms: true,
      conSchOrgYearGU: '',
      conSchTermIndex: '-1',
      termIndex: '-1',
    })
    schedule = parseSchedule(sch)
  } catch {
    /* optional */
  }

  if (!courses.length && schedule.length) {
    courses = schedule.map((s, idx) => ({
      id: `svue-c-${idx}`,
      name: s.courseName,
      teacher: { id: `t-${idx}`, name: s.teacherName },
      period: s.period,
      room: s.room,
      color: COLORS[idx % COLORS.length],
      gradingModel: 'total_points' as const,
      categories: [{ id: `cat-${idx}-all`, name: 'All Assignments', weight: 100 }],
      assignments: [],
    }))
  }

  let attendance: AttendanceRecord[] = []
  try {
    const att = await api(normalized, tokens.access, 'GetStudentAttendanceList', { childIntID: 0 })
    attendance = parseAttendance(att)
  } catch {
    /* optional */
  }
  if (!attendance.length) {
    try {
      const past = await api(normalized, tokens.access, 'GetStudentPastAttendanceData', {
        childIntID: 0,
      })
      attendance = parseAttendance(past)
    } catch {
      /* optional */
    }
  }

  if (!courses.length) {
    throw new Error(
      'Login succeeded but no courses were returned. Your marking period may be closed.'
    )
  }

  return {
    credentials: normalized,
    accessToken: tokens.access,
    student,
    courses,
    schedule,
    attendance,
  }
}

