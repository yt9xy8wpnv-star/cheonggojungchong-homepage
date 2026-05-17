import { createClient } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { universityDepartments } from './data/universityDepartments'

type ProfileRow = {
  email: string | null
  username: string
  name: string
  grade: number | null
  class_no: number | null
  student_no: number | null
  korean_subject: string | null
  math_subject: string | null
  english_choice: string | null
  inquiry1_subject: string | null
  inquiry2_subject: string | null
  second_foreign_subject: string | null
  created_at: string | null
  is_admin: boolean
  is_approved: boolean
  is_rejected: boolean | null
  rejected_at: string | null
  suspension_starts_at: string | null
  suspension_ends_at: string | null
  is_suspended_permanently: boolean | null
  role: UserRole | null
}

type ApprovalProfileRow = ProfileRow & {
  id: string
}

type MemberProfileRow = ApprovalProfileRow

type SignupSubjectSelections = {
  korean: string
  math: string
  english: string
  inquiry1: string
  inquiry2: string
  secondForeign: string
}

type ScoreForm = {
  koreanSubject: string
  mathSubject: string
  inquiry1Subject: string
  inquiry2Subject: string
  korean: string
  english: string
  math: string
  koreanHistory: string
  inquiry1: string
  inquiry2: string
}

type GoalGrades = {
  korean: string
  math: string
  english: string
  inquiry1: string
  inquiry2: string
}

type GoalPlan = {
  university: string
  department: string
  grades: GoalGrades
}

type GoalPlanRow = {
  university: string
  department: string
  korean_grade: number | null
  math_grade: number | null
  english_grade: number | null
  inquiry1_grade: number | null
  inquiry2_grade: number | null
}

type SubjectSecondsMap = Record<string, number>

type StudyTimerRow = {
  user_id: string
  username: string | null
  name: string | null
  current_seconds: number | null
  is_running: boolean | null
  current_subject: string | null
  subject_seconds: unknown
  updated_at: string | null
}

type UserRole = 'member' | 'sub_admin' | 'admin'

const roleOptions: UserRole[] = ['member', 'sub_admin', 'admin']

const viteEnv =
  typeof import.meta !== 'undefined' &&
  import.meta &&
  typeof import.meta.env === 'object' &&
  import.meta.env !== null
    ? (import.meta.env as Record<string, string | undefined>)
    : undefined

const supabaseUrl = viteEnv?.VITE_SUPABASE_URL ?? ''
const supabaseKey = viteEnv?.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
const supabaseEnabled = Boolean(supabaseUrl && supabaseKey)
const supabase = supabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null

function normalizeUserRole(role: unknown, legacyIsAdmin = false): UserRole {
  if (role === 'admin' || legacyIsAdmin) return 'admin'
  if (role === 'sub_admin') return 'sub_admin'
  return 'member'
}

function getRoleLabel(role: UserRole, approved: boolean) {
  if (role === 'admin') return '관리자'
  if (role === 'sub_admin') return '부관리자'
  return approved ? '일반 회원' : '승인 대기'
}

function getRoleRank(role: UserRole) {
  if (role === 'admin') return 3
  if (role === 'sub_admin') return 2
  return 1
}

function formatDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSuspensionActive(profile: Pick<ProfileRow, 'is_suspended_permanently' | 'suspension_starts_at' | 'suspension_ends_at'>) {
  if (profile.is_suspended_permanently) return true
  if (!profile.suspension_starts_at || !profile.suspension_ends_at) return false

  const now = Date.now()
  const start = new Date(profile.suspension_starts_at).getTime()
  const end = new Date(profile.suspension_ends_at).getTime()
  return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end
}

function getSuspensionLabel(profile: Pick<ProfileRow, 'is_suspended_permanently' | 'suspension_starts_at' | 'suspension_ends_at'>) {
  if (profile.is_suspended_permanently) return '영구정지'
  if (!profile.suspension_starts_at || !profile.suspension_ends_at) return '정상'

  const start = new Date(profile.suspension_starts_at).toLocaleDateString('ko-KR')
  const end = new Date(profile.suspension_ends_at).toLocaleDateString('ko-KR')
  return `${start} - ${end}`
}

function formatStudentInfo(profile: Pick<ProfileRow, 'grade' | 'class_no' | 'student_no'>) {
  return [profile.grade, profile.class_no, profile.student_no].every((value) => value !== null)
    ? `${profile.grade}학년 ${profile.class_no}반 ${profile.student_no}번`
    : '-'
}

function getProfileSubjectRows(profile: ProfileRow) {
  return [
    ['국어', profile.korean_subject || '-'],
    ['수학', profile.math_subject || '-'],
    ['영어', profile.english_choice || '-'],
    ['탐구1', profile.inquiry1_subject || '-'],
    ['탐구2', profile.inquiry2_subject || '-'],
    ['제2외국어', profile.second_foreign_subject || '-'],
  ] as const
}

const koreanOptions = ['화법과 작문', '언어와 매체']
const mathOptions = ['미적분', '확률과 통계', '기하']
const inquiryOptions = [
  '생활과 윤리',
  '윤리와 사상',
  '한국지리',
  '세계지리',
  '동아시아사',
  '세계사',
  '경제',
  '정치와 법',
  '사회·문화',
  '물리학Ⅰ',
  '화학Ⅰ',
  '생명과학Ⅰ',
  '지구과학Ⅰ',
  '물리학Ⅱ',
  '화학Ⅱ',
  '생명과학Ⅱ',
  '지구과학Ⅱ',
]


const studySubjectOptions = ['국어', '수학', '영어', '탐구1', '탐구2', '한국사'] as const

function createEmptySubjectSeconds(): SubjectSecondsMap {
  return Object.fromEntries(studySubjectOptions.map((subject) => [subject, 0])) as SubjectSecondsMap
}

function normalizeSubjectSeconds(value: unknown): SubjectSecondsMap {
  const base = createEmptySubjectSeconds()
  if (!value || typeof value !== 'object') return base

  for (const subject of studySubjectOptions) {
    const raw = (value as Record<string, unknown>)[subject]
    const parsed = typeof raw === 'number' ? raw : Number(raw ?? 0)
    base[subject] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
  }

  return base
}

function formatStudyDuration(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function getDisplayStudySeconds(row: Pick<StudyTimerRow, 'current_seconds' | 'subject_seconds' | 'is_running' | 'updated_at'>) {
  const currentSeconds = Number(row.current_seconds ?? 0)
  const normalizedCurrentSeconds = Number.isFinite(currentSeconds) && currentSeconds > 0 ? Math.floor(currentSeconds) : 0
  const subjectSeconds = normalizeSubjectSeconds(row.subject_seconds)
  const subjectSum = Object.values(subjectSeconds).reduce((sum, value) => sum + value, 0)
  const baseSeconds = Math.max(normalizedCurrentSeconds, subjectSum)

  if (!row.is_running || !row.updated_at) return baseSeconds

  const updatedAt = new Date(row.updated_at).getTime()
  if (Number.isNaN(updatedAt)) return baseSeconds

  const elapsedSeconds = Math.max(Math.floor((Date.now() - updatedAt) / 1000), 0)
  return baseSeconds + elapsedSeconds
}

function getDisplaySubjectSeconds(row: Pick<StudyTimerRow, 'subject_seconds' | 'is_running' | 'updated_at' | 'current_subject'>) {
  const subjectSeconds = normalizeSubjectSeconds(row.subject_seconds)

  if (!row.is_running || !row.updated_at || !row.current_subject || !studySubjectOptions.includes(row.current_subject as (typeof studySubjectOptions)[number])) {
    return subjectSeconds
  }

  const updatedAt = new Date(row.updated_at).getTime()
  if (Number.isNaN(updatedAt)) return subjectSeconds

  const elapsedSeconds = Math.max(Math.floor((Date.now() - updatedAt) / 1000), 0)
  const subject = row.current_subject as (typeof studySubjectOptions)[number]
  return {
    ...subjectSeconds,
    [subject]: (subjectSeconds[subject] ?? 0) + elapsedSeconds,
  }
}

const cutlineRows = [
  ['국어(화법과 작문)', '100-97', '129', '96', '96-92', '125', '91'],
  ['국어(언어와 매체)', '100-94', '129', '96', '93-88', '125', '91'],
  ['수학(확률과 통계)', '100-86', '135', '96', '87-75', '127', '88'],
  ['수학(미적분)', '100-83', '135', '96', '85-73', '127', '88'],
  ['수학(기하)', '100-84', '135', '96', '86-73', '127', '88'],
  ['경제', '39', '73', '96', '31', '65', '89'],
  ['정치와 법', '48', '69', '96', '42', '65', '90'],
  ['사회문화', '46', '66', '96', '42', '62', '88'],
  ['세계사', '50', '70', '97', '45', '66', '89'],
  ['동아시아사', '48', '69', '95', '42', '64', '90'],
  ['한국지리', '44', '70', '96', '37', '64', '89'],
  ['세계지리', '47', '67', '95', '42', '63', '89'],
  ['생활과윤리', '47', '69', '96', '41', '63', '89'],
  ['윤리와사상', '44', '70', '96', '37', '63', '89'],
  ['물리학1', '47', '69', '97', '40', '63', '88'],
  ['물리학2', '42', '74', '96', '33', '66', '89'],
  ['화학1', '48', '68', '96', '44', '65', '89'],
  ['화학2', '45', '73', '96', '34', '64', '89'],
  ['생명과학1', '43', '65', '96', '40', '63', '90'],
  ['생명과학2', '45', '76', '96', '31', '64', '89'],
  ['지구과학1', '48', '67', '96', '44', '64', '88'],
  ['지구과학2', '42', '75', '96', '30', '64', '89'],
  ['영어', '90', '-', '-', '80', '-', '-'],
  ['한국사', '40', '-', '-', '35', '-', '-'],
] as const

const mockSchedules = [
  ['3월', '24(화)', '서울특별시교육청'],
  ['4월', '-', '-'],
  ['5월', '7(목)', '경기도교육청'],
  ['5월', '23(금)', '더프리미엄 모의고사'],
  ['6월', '4(목)', '한국교육과정평가원'],
  ['7월', '8(수)', '인천광역시교육청'],
  ['8월', '-', '-'],
  ['9월', '2(수)', '한국교육과정평가원'],
  ['10월', '20(화)', '서울특별시교육청'],
  ['11월', '19(목)', '한국교육과정평가원'],
] as const

const achievementCards = [
  ['2027 한국 정시파이터 단체 순위', '전국 1위', '1위'],
  ['2027년 집단 평균 아이큐 순위', '국내 1위 · 아시아 8위', '아시아 8위'],
] as const

const admissionRows = [
  ['서울대 의예과', '6명'],
  ['연세대 의예과', '8명'],
  ['울산대학교 의예과', '10명'],
  ['성균관대학교 의예과', '12명'],
  ['고려대학교 의예과', '16명'],
  ['치의예과', '16명'],
  ['약학과', '23명'],
  ['성균관대학교 반도체', '15명'],
  ['가톨릭대 의예과', '3명'],
  ['기타 의예과', '163명'],
] as const

const serviceCards = [
  ['All About 정시', '입시 정보와 핵심 자료를 정리해 보는 서비스', '/jeongsi-info'],
  ['study with 정시', '학습 루틴과 집중 흐름을 관리하는 서비스', '/service/study-with-jeongsi'],
  ['정시 파출소', '정시 준비 중 막히는 지점을 점검하고 도움을 받는 공간', '/service/fund'],
  ['굿즈샵', '단체 굿즈와 상징 아이템을 확인하는 공간', '/service/goods'],
] as const

const communityCards = [
  ['유튜브', '영상 콘텐츠와 활동 기록을 확인하는 채널', '/notice/community'],
  ['인스타그램', '청고정총 소식과 분위기를 보는 공간', '/notice/community'],
  ['자유게시판', '정시러들의 자유로운 소통 공간', '/notice/community'],
] as const

const introMenu = [
  ['회장 인삿말', '/about/chairman'],
  ['단체 소개', '/about/organization'],
  ['상징 소개', '/about/symbol'],
  ['찾아 오시는 길', '/about/location'],
] as const

const serviceMenu = [
  ['All about 정시', '/jeongsi-info'],
  ['study with 정시', '/service/study-with-jeongsi'],
  ['정시 파출소', '/service/fund'],
  ['굿즈샵', '/service/goods'],
  ['photo booth', '/service/photo-booth'],
] as const

const policeStationButtons = [
  ['성적 신고 접수', '5월 학력평가 풀서비스에서 등급컷과 성적 입력을 확인해.', '/jeongsi-info/may-full-service'],
  ['목표대학 순찰', '마이페이지에서 목표 대학과 과목별 목표 등급을 점검해.', '/mypage'],
  ['공부 루틴 단속', 'study with 정시에서 오늘 공부 흐름과 누적 시간을 관리해.', '/service/study-with-jeongsi'],
  ['입시 정보 조회', 'All About 정시에서 일정과 핵심 자료를 다시 확인해.', '/jeongsi-info'],
  ['도움 요청하기', '자유게시판에서 막히는 지점을 공유하고 같이 해결해.', '/notice/community'],
] as const

const communityMenu = [['커뮤니티', '/notice/community']] as const

const noticeMenu = [
  ['공지사항', '/notice'],
  ['보도자료', '/notice/press'],
] as const

const initialSignupSubjectSelections: SignupSubjectSelections = {
  korean: '화법과 작문',
  math: '미적분',
  english: '응시함',
  inquiry1: '생활과 윤리',
  inquiry2: '응시하지 않음',
  secondForeign: '응시하지 않음',
}

const initialScoreForm: ScoreForm = {
  koreanSubject: '화법과 작문',
  mathSubject: '미적분',
  inquiry1Subject: '생활과 윤리',
  inquiry2Subject: '세계지리',
  korean: '',
  english: '',
  math: '',
  koreanHistory: '',
  inquiry1: '',
  inquiry2: '',
}

const initialGoalGrades: GoalGrades = {
  korean: '',
  math: '',
  english: '',
  inquiry1: '',
  inquiry2: '',
}

const universityLogoMap: Record<string, string> = {
  서울대학교: '/Seoul_univ.png',
  연세대학교: '/Yonsei_univ.png',
  고려대학교: '/korea_univ.png',
  서강대학교: '/sogang_univ.png',
  성균관대학교: '/sungkyunkwan_univ.png',
  한양대학교: '/hanyang_univ.png',
  중앙대학교: '/chungang_univ.png',
  경희대학교: '/kyunghee_univ.png',
  한국외국어대학교: '/foreign_univ.png',
  서울시립대학교: '/seoul_city_univ.png',
  건국대학교: '/konkuk_univ.png',
  동국대학교: '/dongguk_univ.png',
  홍익대학교: '/hongik_univ.png',
  한국과학기술원: '/kaist.png',
  포항공과대학교: '/postech.png',
  대구경북과학기술원: '/dgist.png',
  울산과학기술원: '/unist.png',
  광주과학기술원: '/gist.png',
}

function getUniversityLogo(university: string) {
  return universityLogoMap[university] ?? null
}

function formatGoalGrade(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

function parseGoalGrade(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 9 ? parsed : null
}

function goalPlanFromRow(row: GoalPlanRow): GoalPlan {
  return {
    university: row.university,
    department: row.department,
    grades: {
      korean: formatGoalGrade(row.korean_grade),
      math: formatGoalGrade(row.math_grade),
      english: formatGoalGrade(row.english_grade),
      inquiry1: formatGoalGrade(row.inquiry1_grade),
      inquiry2: formatGoalGrade(row.inquiry2_grade),
    },
  }
}

function SectionShell({
  eyebrow,
  title,
  description,
  children,
  wide = false,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-5xl'} rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10`}>
      <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">{eyebrow}</div>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const closeDropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [currentGrade, setCurrentGrade] = useState<number | null>(null)
  const [currentClassNo, setCurrentClassNo] = useState<number | null>(null)
  const [currentStudentNo, setCurrentStudentNo] = useState<number | null>(null)
  const [currentJoinedAt, setCurrentJoinedAt] = useState('')
  const [currentSubjectSelections, setCurrentSubjectSelections] = useState<SignupSubjectSelections>(initialSignupSubjectSelections)
  const [profileEditUsername, setProfileEditUsername] = useState('')
  const [profileEditPassword, setProfileEditPassword] = useState('')
  const [profileEditPasswordConfirm, setProfileEditPasswordConfirm] = useState('')
  const [profileEditSubjects, setProfileEditSubjects] = useState<SignupSubjectSelections>(initialSignupSubjectSelections)
  const [profileEditMessage, setProfileEditMessage] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [showProfilePassword, setShowProfilePassword] = useState(false)
  const [showProfilePasswordConfirm, setShowProfilePasswordConfirm] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSubAdmin, setIsSubAdmin] = useState(false)
  const [currentRole, setCurrentRole] = useState<UserRole>('member')
  const [isApproved, setIsApproved] = useState(false)
  const [isRejected, setIsRejected] = useState(false)
  const [rejectedAt, setRejectedAt] = useState('')
  const [currentSuspensionStartsAt, setCurrentSuspensionStartsAt] = useState('')
  const [currentSuspensionEndsAt, setCurrentSuspensionEndsAt] = useState('')
  const [currentSuspensionPermanent, setCurrentSuspensionPermanent] = useState(false)
  const [approvalProfiles, setApprovalProfiles] = useState<ApprovalProfileRow[]>([])
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState('')
  const [approvingProfileId, setApprovingProfileId] = useState<string | null>(null)
  const [rejectingProfileId, setRejectingProfileId] = useState<string | null>(null)
  const [expandedApprovalProfileId, setExpandedApprovalProfileId] = useState<string | null>(null)
  const [memberProfiles, setMemberProfiles] = useState<MemberProfileRow[]>([])
  const [memberLoading, setMemberLoading] = useState(false)
  const [memberMessage, setMemberMessage] = useState('')
  const [updatingRoleProfileId, setUpdatingRoleProfileId] = useState<string | null>(null)
  const [expandedMemberProfileId, setExpandedMemberProfileId] = useState<string | null>(null)
  const [suspensionProfile, setSuspensionProfile] = useState<MemberProfileRow | null>(null)
  const [suspensionStartsAt, setSuspensionStartsAt] = useState(formatDateInputValue())
  const [suspensionEndsAt, setSuspensionEndsAt] = useState(formatDateInputValue())
  const [suspensionPermanent, setSuspensionPermanent] = useState(false)
  const [suspendingProfileId, setSuspendingProfileId] = useState<string | null>(null)
  const canManageApprovals = isAdmin || isSubAdmin
  const currentSuspensionStatus = {
    is_suspended_permanently: currentSuspensionPermanent,
    suspension_starts_at: currentSuspensionStartsAt || null,
    suspension_ends_at: currentSuspensionEndsAt || null,
  }
  const currentSuspensionActive = isSuspensionActive(currentSuspensionStatus)
  const currentSuspensionLabel = getSuspensionLabel(currentSuspensionStatus)

  const [studySeconds, setStudySeconds] = useState(0)
  const [studyRunning, setStudyRunning] = useState(false)
  const [currentStudySubject, setCurrentStudySubject] = useState<(typeof studySubjectOptions)[number]>('국어')
  const [subjectSeconds, setSubjectSeconds] = useState<SubjectSecondsMap>(createEmptySubjectSeconds)
  const [studySyncMessage, setStudySyncMessage] = useState('')
  const [studyLeaderboard, setStudyLeaderboard] = useState<StudyTimerRow[]>([])
  const [selectedLeaderboardUserId, setSelectedLeaderboardUserId] = useState<string | null>(null)
  const [leaderboardPreviewUserId, setLeaderboardPreviewUserId] = useState<string | null>(null)
  const studySnapshotRef = useRef({
    currentSeconds: 0,
    isRunning: false,
    currentSubject: '국어',
    subjectTotals: createEmptySubjectSeconds(),
  })

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false)
  const [signupUsername, setSignupUsername] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupGrade, setSignupGrade] = useState('1')
  const [signupClassNo, setSignupClassNo] = useState('1')
  const [signupStudentNo, setSignupStudentNo] = useState('')
  const [signupMessage, setSignupMessage] = useState('')
  const [signupSubjectSelections, setSignupSubjectSelections] = useState<SignupSubjectSelections>(initialSignupSubjectSelections)
  const signupScrollYRef = useRef(0)

  const [scoreForm, setScoreForm] = useState<ScoreForm>(initialScoreForm)
  const [scoreMessage, setScoreMessage] = useState('')
  const [goalUniversitySearch, setGoalUniversitySearch] = useState('')
  const [goalUniversityDropdownOpen, setGoalUniversityDropdownOpen] = useState(false)
  const [goalPlan, setGoalPlan] = useState<GoalPlan | null>(null)
  const [goalDraftUniversity, setGoalDraftUniversity] = useState('')
  const [goalDraftDepartment, setGoalDraftDepartment] = useState('')
  const [goalDraftGrades, setGoalDraftGrades] = useState<GoalGrades>(initialGoalGrades)
  const [goalMessage, setGoalMessage] = useState('')

  function resetAuthState() {
    setCurrentUserId('')
    setIsLoggedIn(false)
    setCurrentUserEmail('')
    setCurrentUsername('')
    setCurrentName('')
    setCurrentGrade(null)
    setCurrentClassNo(null)
    setCurrentStudentNo(null)
    setCurrentJoinedAt('')
    setCurrentSubjectSelections(initialSignupSubjectSelections)
    setProfileEditUsername('')
    setProfileEditPassword('')
    setProfileEditPasswordConfirm('')
    setProfileEditSubjects(initialSignupSubjectSelections)
    setProfileEditMessage('')
    setIsAdmin(false)
    setIsSubAdmin(false)
    setCurrentRole('member')
    setIsApproved(false)
    setIsRejected(false)
    setRejectedAt('')
    setCurrentSuspensionStartsAt('')
    setCurrentSuspensionEndsAt('')
    setCurrentSuspensionPermanent(false)
    setApprovalProfiles([])
    setApprovalMessage('')
    setApprovingProfileId(null)
    setRejectingProfileId(null)
    setExpandedApprovalProfileId(null)
    setMemberProfiles([])
    setMemberMessage('')
    setUpdatingRoleProfileId(null)
    setExpandedMemberProfileId(null)
    setSuspensionProfile(null)
    setSuspensionStartsAt(formatDateInputValue())
    setSuspensionEndsAt(formatDateInputValue())
    setSuspensionPermanent(false)
    setSuspendingProfileId(null)
    setStudySeconds(0)
    setStudyRunning(false)
    setCurrentStudySubject('국어')
    setSubjectSeconds(createEmptySubjectSeconds())
    setStudySyncMessage('')
    setStudyLeaderboard([])
    setSelectedLeaderboardUserId(null)
    setLeaderboardPreviewUserId(null)
    setGoalUniversitySearch('')
    setGoalUniversityDropdownOpen(false)
    setGoalPlan(null)
    setGoalDraftUniversity('')
    setGoalDraftDepartment('')
    setGoalDraftGrades(initialGoalGrades)
    setGoalMessage('')
  }

  async function loadProfile(userId: string, email: string, userMeta?: Record<string, unknown>, joinedAt?: string) {
    if (!supabase) {
      setCurrentUserEmail(email)
      setCurrentUsername(email.split('@')[0] || email)
      setCurrentName('')
      setCurrentGrade(null)
      setCurrentClassNo(null)
      setCurrentStudentNo(null)
      setCurrentJoinedAt(joinedAt ?? '')
      setCurrentSubjectSelections(initialSignupSubjectSelections)
      setProfileEditUsername(email.split('@')[0] || email)
      setProfileEditSubjects(initialSignupSubjectSelections)
      setIsAdmin(false)
      setIsSubAdmin(false)
      setCurrentRole('member')
      setIsApproved(false)
      setIsRejected(false)
      setRejectedAt('')
      setCurrentSuspensionStartsAt('')
      setCurrentSuspensionEndsAt('')
      setCurrentSuspensionPermanent(false)
      return
    }

    const subjectSelections: SignupSubjectSelections = {
      korean: String(userMeta?.korean_subject ?? initialSignupSubjectSelections.korean),
      math: String(userMeta?.math_subject ?? initialSignupSubjectSelections.math),
      english: String(userMeta?.english_choice ?? initialSignupSubjectSelections.english),
      inquiry1: String(userMeta?.inquiry1_subject ?? initialSignupSubjectSelections.inquiry1),
      inquiry2: String(userMeta?.inquiry2_subject ?? initialSignupSubjectSelections.inquiry2),
      secondForeign: String(userMeta?.second_foreign_subject ?? initialSignupSubjectSelections.secondForeign),
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('email, username, name, grade, class_no, student_no, korean_subject, math_subject, english_choice, inquiry1_subject, inquiry2_subject, second_foreign_subject, created_at, is_admin, is_approved, is_rejected, rejected_at, suspension_starts_at, suspension_ends_at, is_suspended_permanently, role')
      .eq('id', userId)
      .maybeSingle<ProfileRow>()

    if (error || !data) {
      const fallbackUsername = String(userMeta?.username ?? email.split('@')[0] ?? email)
      const fallbackName = String(userMeta?.name ?? '')
      setCurrentUserEmail(email)
      setCurrentUsername(fallbackUsername)
      setCurrentName(fallbackName)
      setCurrentGrade(typeof userMeta?.grade === 'number' ? userMeta.grade : Number(userMeta?.grade ?? 0) || null)
      setCurrentClassNo(typeof userMeta?.class_no === 'number' ? userMeta.class_no : Number(userMeta?.class_no ?? 0) || null)
      setCurrentStudentNo(typeof userMeta?.student_no === 'number' ? userMeta.student_no : Number(userMeta?.student_no ?? 0) || null)
      setCurrentJoinedAt(joinedAt ?? '')
      setCurrentSubjectSelections(subjectSelections)
      setProfileEditUsername(fallbackUsername)
      setProfileEditSubjects(subjectSelections)
      setIsAdmin(false)
      setIsSubAdmin(false)
      setCurrentRole('member')
      setIsApproved(false)
      setIsRejected(false)
      setRejectedAt('')
      setCurrentSuspensionStartsAt('')
      setCurrentSuspensionEndsAt('')
      setCurrentSuspensionPermanent(false)
      return
    }

    const dataSubjectSelections: SignupSubjectSelections = {
      korean: data.korean_subject || initialSignupSubjectSelections.korean,
      math: data.math_subject || initialSignupSubjectSelections.math,
      english: data.english_choice || initialSignupSubjectSelections.english,
      inquiry1: data.inquiry1_subject || initialSignupSubjectSelections.inquiry1,
      inquiry2: data.inquiry2_subject || initialSignupSubjectSelections.inquiry2,
      secondForeign: data.second_foreign_subject || initialSignupSubjectSelections.secondForeign,
    }

    setCurrentUserEmail(email)
    setCurrentUsername(data.username)
    setCurrentName(data.name)
    setCurrentGrade(data.grade ?? null)
    setCurrentClassNo(data.class_no ?? null)
    setCurrentStudentNo(data.student_no ?? null)
    setCurrentJoinedAt(data.created_at ?? joinedAt ?? '')
    setCurrentSubjectSelections(dataSubjectSelections)
    setProfileEditUsername(data.username)
    setProfileEditSubjects(dataSubjectSelections)
    const role = normalizeUserRole(data.role, data.is_admin)
    setCurrentRole(role)
    setIsAdmin(role === 'admin')
    setIsSubAdmin(role === 'sub_admin')
    setIsApproved(data.is_approved)
    setIsRejected(Boolean(data.is_rejected))
    setRejectedAt(data.rejected_at ?? '')
    setCurrentSuspensionStartsAt(data.suspension_starts_at ?? '')
    setCurrentSuspensionEndsAt(data.suspension_ends_at ?? '')
    setCurrentSuspensionPermanent(Boolean(data.is_suspended_permanently))
  }

  useEffect(() => {
    let mounted = true
    let lastQueuedProfileUserId = ''

    type RestoredSession = {
      user?: {
        id: string
        email?: string
        user_metadata?: Record<string, unknown>
        created_at?: string
      }
    } | null

    function applySessionSnapshot(session: RestoredSession) {
      if (!mounted) return null

      if (!session?.user) {
        resetAuthState()
        return null
      }

      const fallbackUsername = String(session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? session.user.email ?? '')
      setCurrentUserId(session.user.id)
      setIsLoggedIn(true)
      setCurrentUserEmail(session.user.email ?? '')
      setCurrentUsername(fallbackUsername)
      setCurrentJoinedAt(session.user.created_at ?? '')
      return session.user
    }

    function queueProfileLoad(user: NonNullable<ReturnType<typeof applySessionSnapshot>>) {
      if (lastQueuedProfileUserId === user.id) return
      lastQueuedProfileUserId = user.id

      window.setTimeout(() => {
        if (!mounted) return

        void loadProfile(user.id, user.email ?? '', user.user_metadata ?? {}, user.created_at ?? '').catch((error) => {
          console.error('profile load error:', error)
        })
      }, 0)
    }

    async function initAuth() {
      if (!supabase) {
        if (mounted) setSessionReady(true)
        return
      }

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('auth session restore error:', error)
          applySessionSnapshot(null)
        } else {
          const user = applySessionSnapshot(data.session)
          if (user) queueProfileLoad(user)
        }
      } catch (error) {
        console.error('auth init error:', error)
        applySessionSnapshot(null)
      } finally {
        if (mounted) setSessionReady(true)
      }
    }

    void initAuth()

    if (!supabase) {
      return () => {
        mounted = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      try {
        const user = applySessionSnapshot(session)
        if (user) queueProfileLoad(user)
      } catch (error) {
        console.error('auth state change error:', error)
        resetAuthState()
      } finally {
        if (mounted) setSessionReady(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setOpenDropdown(null)
    if (closeDropdownTimer.current) {
      clearTimeout(closeDropdownTimer.current)
      closeDropdownTimer.current = null
    }
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (closeDropdownTimer.current) {
        clearTimeout(closeDropdownTimer.current)
      }
    }
  }, [])

  function updateSignupSubject(field: keyof SignupSubjectSelections, value: string) {
    signupScrollYRef.current = window.scrollY
    setSignupSubjectSelections((prev) => ({ ...prev, [field]: value }))
    requestAnimationFrame(() => {
      window.scrollTo({ top: signupScrollYRef.current, behavior: 'auto' })
    })
  }

  async function handleSupabaseSignup() {
    setSignupMessage('')

    if (!supabase) {
      setSignupMessage('Supabase 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인해주세요.')
      return
    }

    const client = supabase
    if (!signupEmail.trim()) {
      setSignupMessage('이메일을 입력해주세요.')
      return
    }
    if (!signupUsername.trim()) {
      setSignupMessage('아이디를 입력해주세요.')
      return
    }
    if (!signupName.trim()) {
      setSignupMessage('이름을 입력해주세요.')
      return
    }
    if (!signupStudentNo.trim()) {
      setSignupMessage('번호를 입력해주세요.')
      return
    }
    if (signupPassword.length < 8 || signupPassword.length > 20) {
      setSignupMessage('비밀번호는 8자 이상 20자 이하여야 합니다.')
      return
    }
    if (signupPassword !== signupPasswordConfirm) {
      setSignupMessage('비밀번호가 서로 일치하지 않습니다.')
      return
    }
    if (
      signupSubjectSelections.inquiry1 !== '응시하지 않음' &&
      signupSubjectSelections.inquiry2 !== '응시하지 않음' &&
      signupSubjectSelections.inquiry1 === signupSubjectSelections.inquiry2
    ) {
      setSignupMessage('탐구 1과 탐구 2의 선택과목이 같습니다. 서로 다르게 선택해야 합니다.')
      return
    }

    const { error } = await client.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: {
          username: signupUsername.trim(),
          name: signupName.trim(),
          grade: Number(signupGrade),
          class_no: Number(signupClassNo),
          student_no: Number(signupStudentNo),
          korean_subject: signupSubjectSelections.korean,
          math_subject: signupSubjectSelections.math,
          english_choice: signupSubjectSelections.english,
          inquiry1_subject: signupSubjectSelections.inquiry1,
          inquiry2_subject: signupSubjectSelections.inquiry2,
          second_foreign_subject: signupSubjectSelections.secondForeign,
        },
      },
    })

    if (error) {
      setSignupMessage(error.message)
      return
    }

    setSignupMessage('회원가입 신청이 접수되었습니다. 관리자 승인 후 이용할 수 있습니다.')
    setSignupEmail('')
    setSignupPassword('')
    setSignupPasswordConfirm('')
    setSignupUsername('')
    setSignupName('')
    setSignupStudentNo('')
    setSignupSubjectSelections(initialSignupSubjectSelections)
    navigate('/login')
  }

  async function ensureProfileExists() {
    if (!supabase) return true

    const client = supabase

    const {
      data: { user },
    } = await client.auth.getUser()

    if (!user) return false

    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('profile existence check failed:', error)
      return true
    }

    if (data) return true

    const meta = user.user_metadata as Record<string, unknown>
    const fallbackEmail = user.email ?? ''
    const fallbackUsername = String(meta.username ?? fallbackEmail.split('@')[0] ?? '회원')
    const fallbackName = String(meta.name ?? '')
    const parseMetaNumber = (value: unknown) => {
      const parsed = typeof value === 'number' ? value : Number(value ?? 0)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }

    const { error: insertError } = await client.from('profiles').insert({
      id: user.id,
      email: fallbackEmail,
      username: fallbackUsername,
      name: fallbackName,
      grade: parseMetaNumber(meta.grade),
      class_no: parseMetaNumber(meta.class_no),
      student_no: parseMetaNumber(meta.student_no),
      korean_subject: String(meta.korean_subject ?? initialSignupSubjectSelections.korean),
      math_subject: String(meta.math_subject ?? initialSignupSubjectSelections.math),
      english_choice: String(meta.english_choice ?? initialSignupSubjectSelections.english),
      inquiry1_subject: String(meta.inquiry1_subject ?? initialSignupSubjectSelections.inquiry1),
      inquiry2_subject: String(meta.inquiry2_subject ?? initialSignupSubjectSelections.inquiry2),
      second_foreign_subject: String(meta.second_foreign_subject ?? initialSignupSubjectSelections.secondForeign),
      is_admin: false,
      role: 'member',
      is_approved: false,
      is_rejected: false,
      rejected_at: null,
      suspension_starts_at: null,
      suspension_ends_at: null,
      is_suspended_permanently: false,
      created_at: user.created_at ?? new Date().toISOString(),
    })

    if (insertError) {
      console.error('profile creation failed:', insertError)
      return false
    }

    return true
  }

  async function handleSupabaseLogin() {
    setLoginMessage('')

    if (!supabase) {
      setLoginMessage('Supabase 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인해주세요.')
      return
    }

    const client = supabase

    const { error } = await client.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    if (error) {
      setLoginMessage('로그인 실패: ' + error.message)
      return
    }

    const profileReady = await ensureProfileExists()
    if (!profileReady) {
      setLoginMessage('로그인은 됐지만 프로필 생성에 실패했어. Supabase profiles 정책과 트리거를 확인해줘.')
      return
    }

    setLoginMessage('로그인 성공')
    navigate('/')
  }

  async function handleLogout() {
    resetAuthState()
    if (!supabase) {
      navigate('/')
      return
    }
    const client = supabase
    await client.auth.signOut()
    navigate('/')
  }


  async function persistStudyTimerState(next: {
    currentSeconds: number
    isRunning: boolean
    currentSubject: string
    subjectTotals: SubjectSecondsMap
  }) {
    if (!supabase || !currentUserId) return

    const client = supabase

    const { error } = await client.from('study_timer_status').upsert(
      {
        user_id: currentUserId,
        username: currentUsername || currentUserEmail.split('@')[0] || 'user',
        name: currentName || null,
        current_seconds: next.currentSeconds,
        is_running: next.isRunning,
        current_subject: next.currentSubject,
        subject_seconds: next.subjectTotals,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류가 발생했습니다.') : '알 수 없는 오류가 발생했습니다.'
      throw new Error(message)
    }
  }

  async function resetCurrentUserStudyTimerState(currentSubject: string, subjectTotals: SubjectSecondsMap) {
    if (!supabase || !currentUserId) return

    const updatedAt = new Date().toISOString()
    const payload = {
      username: currentUsername || currentUserEmail.split('@')[0] || 'user',
      name: currentName || null,
      current_seconds: 0,
      is_running: false,
      current_subject: currentSubject,
      subject_seconds: subjectTotals,
      updated_at: updatedAt,
    }

    const { error } = await supabase
      .from('study_timer_status')
      .update(payload)
      .eq('user_id', currentUserId)

    if (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류가 발생했습니다.') : '알 수 없는 오류가 발생했습니다.'
      throw new Error(message)
    }

    setStudyLeaderboard((prev) =>
      prev.map((row) =>
        row.user_id === currentUserId
          ? {
              ...row,
              ...payload,
              user_id: currentUserId,
            }
          : row,
      ),
    )
  }

  async function fetchStudyLeaderboard() {
    if (!supabase || !isLoggedIn) return

    const client = supabase

    const { data, error } = await client
      .from('study_timer_status')
      .select('user_id, username, name, current_seconds, is_running, current_subject, subject_seconds, updated_at')
      .order('current_seconds', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류가 발생했습니다.') : '알 수 없는 오류가 발생했습니다.'
      throw new Error(message)
    }

    setStudyLeaderboard((data ?? []) as StudyTimerRow[])
  }

  useEffect(() => {
    if (!studyRunning) return

    const tick = window.setInterval(() => {
      setStudySeconds((prev) => prev + 1)
      setSubjectSeconds((prev) => ({
        ...prev,
        [currentStudySubject]: (prev[currentStudySubject] ?? 0) + 1,
      }))
    }, 1000)

    return () => window.clearInterval(tick)
  }, [studyRunning, currentStudySubject])

  useEffect(() => {
    studySnapshotRef.current = {
      currentSeconds: studySeconds,
      isRunning: studyRunning,
      currentSubject: currentStudySubject,
      subjectTotals: subjectSeconds,
    }
  }, [currentStudySubject, studyRunning, studySeconds, subjectSeconds])

  useEffect(() => {
    if (!supabase || !isLoggedIn || !currentUserId) return

    let cancelled = false

    async function bootstrapStudyTimer() {
      try {
        const { data, error } = await supabase
          .from('study_timer_status')
          .select('current_seconds, is_running, current_subject, subject_seconds, updated_at')
          .eq('user_id', currentUserId)
          .maybeSingle()

        if (error) throw error
        if (cancelled || !data) return

        const restoredSubject =
          typeof data.current_subject === 'string' && studySubjectOptions.includes(data.current_subject as (typeof studySubjectOptions)[number])
            ? (data.current_subject as (typeof studySubjectOptions)[number])
            : '국어'
        const restoredRunning = Boolean(data.is_running)
        const restoredSeconds = Math.max(Math.floor(Number(data.current_seconds ?? 0)), 0)
        const restoredSubjectSeconds = normalizeSubjectSeconds(data.subject_seconds)
        const updatedAt = data.updated_at ? new Date(data.updated_at).getTime() : Number.NaN
        const elapsedSeconds = restoredRunning && Number.isFinite(updatedAt) ? Math.max(Math.floor((Date.now() - updatedAt) / 1000), 0) : 0
        const nextSubjectSeconds = {
          ...restoredSubjectSeconds,
          [restoredSubject]: (restoredSubjectSeconds[restoredSubject] ?? 0) + elapsedSeconds,
        }

        setStudySeconds(restoredSeconds + elapsedSeconds)
        setStudyRunning(restoredRunning)
        setCurrentStudySubject(restoredSubject)
        setSubjectSeconds(nextSubjectSeconds)
      } catch (error) {
        console.error('study timer bootstrap error:', error)
      }
    }

    void bootstrapStudyTimer()

    return () => {
      cancelled = true
    }
  }, [currentUserId, isLoggedIn])

  useEffect(() => {
    if (!supabase || !isLoggedIn || !currentUserId) return

    const sync = window.setInterval(() => {
      void persistStudyTimerState(studySnapshotRef.current).then(() => {
        setStudySyncMessage('')
      }).catch((error) => {
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        setStudySyncMessage(`타이머 상태를 동기화하지 못했습니다: ${message}`)
      })
    }, 5000)

    return () => window.clearInterval(sync)
  }, [currentUserId, isLoggedIn])

  useEffect(() => {
    if (!supabase || !isLoggedIn) return

    let cancelled = false

    async function loadLeaderboard() {
      try {
        await fetchStudyLeaderboard()
      } catch (error) {
        if (!cancelled) {
          console.error('study leaderboard error:', error)
        }
      }
    }

    void loadLeaderboard()
    const timer = window.setInterval(() => {
      void loadLeaderboard()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!currentUserId) return

    setStudyLeaderboard((prev) => {
      const currentRow: StudyTimerRow = {
        user_id: currentUserId,
        username: currentUsername || currentUserEmail.split('@')[0] || null,
        name: currentName || null,
        current_seconds: studySeconds,
        is_running: studyRunning,
        current_subject: currentStudySubject,
        subject_seconds: subjectSeconds,
        updated_at: new Date().toISOString(),
      }

      const hasExistingRow = prev.some((row) => row.user_id === currentUserId)
      if (hasExistingRow) {
        return prev.map((row) => (row.user_id === currentUserId ? { ...row, ...currentRow } : row))
      }

      return [currentRow, ...prev]
    })
  }, [currentStudySubject, currentName, currentUserEmail, currentUserId, currentUsername, studyRunning, studySeconds, subjectSeconds])

  const displayStudyLeaderboard = useMemo(() => {
    return [...studyLeaderboard]
      .map((row) => ({
        ...row,
        username: typeof row.username === 'string' ? row.username.trim() : row.username,
        name: typeof row.name === 'string' ? row.name.trim() : row.name,
        current_seconds: getDisplayStudySeconds(row),
        subject_seconds: getDisplaySubjectSeconds(row),
      }))
      .sort((a, b) => {
        const secondGap = Number(b.current_seconds ?? 0) - Number(a.current_seconds ?? 0)
        if (secondGap !== 0) return secondGap

        const updatedAtA = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const updatedAtB = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return updatedAtB - updatedAtA
      })
  }, [studyLeaderboard])

  const homeStudyStats = useMemo(() => {
    if (!isLoggedIn) {
      return [
        ['LIVE STATUS', '로그인 필요', '로그인 후 현재 공부 중인 인원을 확인할 수 있어.'],
        ['TOP STUDY', '로그인 후 확인', '로그인 후 누적 공부 시간 1위를 확인할 수 있어.'],
        ['TOTAL DRIVE', '로그인 후 확인', '로그인 후 회원 전체 누적 공부 시간을 확인할 수 있어.'],
      ] as const
    }

    const topStudyUser = displayStudyLeaderboard[0] ?? null
    const topStudyName = topStudyUser
      ? String(topStudyUser.username || topStudyUser.name || 'unknown').split('@')[0]
      : '기록 없음'
    const runningCount = displayStudyLeaderboard.filter((row) => row.is_running).length
    const totalSeconds = displayStudyLeaderboard.reduce((sum, row) => sum + Number(row.current_seconds ?? 0), 0)

    return [
      ['LIVE STATUS', `${runningCount}명`, '현재 study with 정시에서 공부 중인 인원'],
      ['TOP STUDY', topStudyName, '누적 공부 시간 전체 랭킹 1위'],
      ["TOTAL DRIVE", formatStudyDuration(totalSeconds), '회원 전체 누적 공부 시간'],
    ] as const
  }, [displayStudyLeaderboard, isLoggedIn])

  useEffect(() => {
    setSelectedLeaderboardUserId((prev) => {
      if (displayStudyLeaderboard.length === 0) return null
      if (prev && displayStudyLeaderboard.some((row) => row.user_id === prev)) return prev
      return displayStudyLeaderboard[0]?.user_id ?? null
    })
  }, [displayStudyLeaderboard])

  useEffect(() => {
    if (!canManageApprovals || location.pathname !== '/admin/approvals') return

    void fetchApprovalProfiles()
  }, [canManageApprovals, location.pathname])

  useEffect(() => {
    if (!canManageApprovals || location.pathname !== '/admin/members') return

    void fetchMemberProfiles()
  }, [canManageApprovals, location.pathname])

  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return

    let cancelled = false

    async function loadGoalPlan() {
      if (!supabase) return

      try {
        const { data, error } = await supabase
          .from('goal_plans')
          .select('university, department, korean_grade, math_grade, english_grade, inquiry1_grade, inquiry2_grade')
          .eq('user_id', currentUserId)
          .maybeSingle<GoalPlanRow>()

        if (cancelled) return
        if (error) throw error

        if (!data) {
          setGoalPlan(null)
          setGoalUniversitySearch('')
          setGoalUniversityDropdownOpen(false)
          setGoalDraftUniversity('')
          setGoalDraftDepartment('')
          setGoalDraftGrades(initialGoalGrades)
          return
        }

        const plan = goalPlanFromRow(data)
        setGoalPlan(plan)
        setGoalUniversitySearch(plan.university)
        setGoalUniversityDropdownOpen(false)
        setGoalDraftUniversity(plan.university)
        setGoalDraftDepartment(plan.department)
        setGoalDraftGrades(plan.grades)
      } catch (error) {
        console.error('goal plan load error:', error)
        if (!cancelled) {
          setGoalMessage('목표 대학 정보를 불러오지 못했어. Supabase goal_plans 테이블과 정책을 확인해줘.')
        }
      }
    }

    void loadGoalPlan()

    return () => {
      cancelled = true
    }
  }, [currentUserId, isLoggedIn])

  function formatJoinedDate(value: string) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('ko-KR')
  }

  async function handleProfileSave() {
    setProfileEditMessage('')

    if (!isLoggedIn || !currentUserId || !supabase) {
      setProfileEditMessage('로그인 후 이용할 수 있어.')
      return
    }

    const trimmedUsername = profileEditUsername.trim()
    if (!trimmedUsername) {
      setProfileEditMessage('아이디를 입력해줘.')
      return
    }
    if (profileEditPassword && profileEditPassword.length < 8) {
      setProfileEditMessage('비밀번호는 8자 이상이어야 해.')
      return
    }
    if (profileEditPassword !== profileEditPasswordConfirm) {
      setProfileEditMessage('비밀번호 확인이 일치하지 않아.')
      return
    }
    if (
      profileEditSubjects.inquiry1 !== '응시하지 않음' &&
      profileEditSubjects.inquiry2 !== '응시하지 않음' &&
      profileEditSubjects.inquiry1 === profileEditSubjects.inquiry2
    ) {
      setProfileEditMessage('탐구1과 탐구2는 서로 달라야 해.')
      return
    }

    setProfileSaving(true)
    try {
      const client = supabase
      const { error: profileError } = await client
        .from('profiles')
        .update({ username: trimmedUsername })
        .eq('id', currentUserId)

      if (profileError) throw profileError

      const payload: Record<string, unknown> = {
        username: trimmedUsername,
        korean_subject: profileEditSubjects.korean,
        math_subject: profileEditSubjects.math,
        english_choice: profileEditSubjects.english,
        inquiry1_subject: profileEditSubjects.inquiry1,
        inquiry2_subject: profileEditSubjects.inquiry2,
        second_foreign_subject: profileEditSubjects.secondForeign,
      }
      if (profileEditPassword) payload.password = profileEditPassword

      const { error: authError } = await client.auth.updateUser({
        ...(profileEditPassword ? { password: profileEditPassword } : {}),
        data: payload,
      })
      if (authError) throw authError

      setCurrentUsername(trimmedUsername)
      setCurrentSubjectSelections(profileEditSubjects)
      setProfileEditPassword('')
      setProfileEditPasswordConfirm('')
      setProfileEditMessage('프로필 정보를 수정했어.')
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setProfileEditMessage(`프로필 수정 실패: ${message}`)
    } finally {
      setProfileSaving(false)
    }
  }

  async function fetchApprovalProfiles() {
    if (!supabase || !isLoggedIn || !canManageApprovals) return

    setApprovalLoading(true)
    setApprovalMessage('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, name, grade, class_no, student_no, korean_subject, math_subject, english_choice, inquiry1_subject, inquiry2_subject, second_foreign_subject, created_at, is_admin, is_approved, is_rejected, rejected_at, suspension_starts_at, suspension_ends_at, is_suspended_permanently, role')
        .or('is_approved.eq.false,is_approved.is.null')
        .or('is_rejected.eq.false,is_rejected.is.null')
        .order('created_at', { ascending: false })

      if (error) throw error

      setApprovalProfiles((data ?? []) as ApprovalProfileRow[])
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setApprovalMessage(`승인 대기 회원을 불러오지 못했습니다: ${message}`)
    } finally {
      setApprovalLoading(false)
    }
  }

  async function handleApproveProfile(profileId: string) {
    if (!supabase || !isLoggedIn || !canManageApprovals) {
      setApprovalMessage('관리자 또는 부관리자만 회원을 승인할 수 있습니다.')
      return
    }

    setApprovingProfileId(profileId)
    setApprovalMessage('')
    try {
      const { error } = await supabase.rpc('approve_profile', {
        target_profile_id: profileId,
        next_role: 'member',
      })

      if (error) throw error

      setApprovalProfiles((prev) => prev.filter((profile) => profile.id !== profileId))
      setApprovalMessage('회원 승인이 완료되었습니다.')
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setApprovalMessage(`회원 승인 실패: ${message}`)
    } finally {
      setApprovingProfileId(null)
    }
  }

  async function handleRejectProfile(profileId: string) {
    if (!supabase || !isLoggedIn || !canManageApprovals) {
      setApprovalMessage('관리자 또는 부관리자만 회원가입을 거절할 수 있습니다.')
      return
    }

    setRejectingProfileId(profileId)
    setApprovalMessage('')
    try {
      const { error } = await supabase.rpc('reject_profile', {
        target_profile_id: profileId,
      })

      if (error) throw error

      setApprovalProfiles((prev) => prev.filter((profile) => profile.id !== profileId))
      setApprovalMessage('회원가입 신청을 거절했습니다.')
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setApprovalMessage(`회원가입 거절 실패: ${message}`)
    } finally {
      setRejectingProfileId(null)
    }
  }

  async function fetchMemberProfiles() {
    if (!supabase || !isLoggedIn || !canManageApprovals) return

    setMemberLoading(true)
    setMemberMessage('')
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, username, name, grade, class_no, student_no, korean_subject, math_subject, english_choice, inquiry1_subject, inquiry2_subject, second_foreign_subject, created_at, is_admin, is_approved, is_rejected, rejected_at, suspension_starts_at, suspension_ends_at, is_suspended_permanently, role')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      query = isAdmin ? query.in('role', ['member', 'sub_admin']) : query.eq('role', 'member')

      const { data, error } = await query

      if (error) throw error

      setMemberProfiles(((data ?? []) as MemberProfileRow[]).filter((profile) => profile.id !== currentUserId))
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setMemberMessage(`회원 목록을 불러오지 못했습니다: ${message}`)
    } finally {
      setMemberLoading(false)
    }
  }

  function canEditMemberProfile(profile: MemberProfileRow) {
    const targetRole = normalizeUserRole(profile.role, profile.is_admin)
    return profile.id !== currentUserId && getRoleRank(currentRole) > getRoleRank(targetRole)
  }

  function getEditableRoleOptions() {
    return roleOptions.filter((role) => getRoleRank(role) <= getRoleRank(currentRole))
  }

  async function handleRoleChange(profile: MemberProfileRow, nextRole: UserRole) {
    if (!supabase || !isLoggedIn || !canManageApprovals) {
      setMemberMessage('관리자 또는 부관리자만 회원 권한을 관리할 수 있습니다.')
      return
    }

    const role = normalizeUserRole(profile.role, profile.is_admin)
    if (role === nextRole) return

    if (!canEditMemberProfile(profile) || getRoleRank(nextRole) > getRoleRank(currentRole)) {
      setMemberMessage('자신과 같거나 높은 등급의 회원은 수정할 수 없습니다.')
      return
    }

    setUpdatingRoleProfileId(profile.id)
    setMemberMessage('')
    try {
      const { error } = await supabase.rpc('update_profile_role', {
        target_profile_id: profile.id,
        next_role: nextRole,
      })

      if (error) throw error

      setMemberMessage(`${profile.username || profile.name || '회원'}님의 등급을 ${getRoleLabel(nextRole, true)}로 변경했습니다.`)
      await fetchMemberProfiles()
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setMemberMessage(`등급 변경 실패: ${message}`)
    } finally {
      setUpdatingRoleProfileId(null)
    }
  }

  function openSuspensionDialog(profile: MemberProfileRow) {
    if (!canEditMemberProfile(profile)) {
      setMemberMessage('자신과 같거나 높은 등급의 회원은 수정할 수 없습니다.')
      return
    }

    const start = new Date()
    const end = new Date()
    end.setDate(start.getDate() + 7)
    setSuspensionProfile(profile)
    setSuspensionStartsAt(formatDateInputValue(start))
    setSuspensionEndsAt(formatDateInputValue(end))
    setSuspensionPermanent(false)
    setMemberMessage('')
  }

  async function handleSuspendProfile() {
    if (!supabase || !isLoggedIn || !canManageApprovals || !suspensionProfile) {
      setMemberMessage('관리자 또는 부관리자만 회원 자격을 관리할 수 있습니다.')
      return
    }

    if (!canEditMemberProfile(suspensionProfile)) {
      setMemberMessage('자신과 같거나 높은 등급의 회원은 수정할 수 없습니다.')
      return
    }

    if (!suspensionPermanent && (!suspensionStartsAt || !suspensionEndsAt)) {
      setMemberMessage('정지 시작일과 종료일을 선택해주세요.')
      return
    }

    const suspensionStart = suspensionStartsAt ? new Date(`${suspensionStartsAt}T00:00:00`).toISOString() : new Date().toISOString()
    const suspensionEnd = suspensionPermanent ? null : new Date(`${suspensionEndsAt}T23:59:59`).toISOString()

    if (!suspensionPermanent && suspensionEnd && new Date(suspensionStart).getTime() > new Date(suspensionEnd).getTime()) {
      setMemberMessage('정지 종료일은 시작일 이후여야 합니다.')
      return
    }

    setSuspendingProfileId(suspensionProfile.id)
    setMemberMessage('')
    try {
      const { error } = await supabase.rpc('suspend_profile', {
        target_profile_id: suspensionProfile.id,
        suspension_start: suspensionStart,
        suspension_end: suspensionEnd,
        permanent: suspensionPermanent,
      })

      if (error) throw error

      setMemberMessage(`${suspensionProfile.username || suspensionProfile.name || '회원'}님의 회원 자격 박탈이 완료되었습니다.`)
      setSuspensionProfile(null)
      await fetchMemberProfiles()
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setMemberMessage(`회원 자격 박탈 실패: ${message}`)
    } finally {
      setSuspendingProfileId(null)
    }
  }


  const predictedTotal = useMemo(
    () =>
      (Number(scoreForm.korean) || 0) +
      (Number(scoreForm.english) || 0) +
      (Number(scoreForm.math) || 0) +
      (Number(scoreForm.koreanHistory) || 0) +
      (Number(scoreForm.inquiry1) || 0) +
      (Number(scoreForm.inquiry2) || 0),
    [scoreForm],
  )

  const inquiryDuplicate = scoreForm.inquiry1Subject === scoreForm.inquiry2Subject

  function updateScoreField(field: keyof ScoreForm, value: string) {
    setScoreForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFakeScoreSave() {
    setScoreMessage('')
    if (!isLoggedIn) {
      setScoreMessage('로그인 후 이용할 수 있습니다.')
      return
    }
    if (!isApproved) {
      setScoreMessage('관리자 승인 후 성적 입력이 가능합니다.')
      return
    }
    if (inquiryDuplicate) {
      setScoreMessage('탐구 1과 탐구 2는 서로 달라야 합니다.')
      return
    }
    setScoreMessage('다음 단계에서 Supabase DB에 실제 저장하도록 연결할 예정입니다.')
  }

  function handleGoalGradeChange(field: keyof GoalGrades, value: string) {
    const normalized = value.replace(/[^1-9]/g, '').slice(0, 1)
    setGoalDraftGrades((prev) => ({ ...prev, [field]: normalized }))
  }

  async function handleSaveGoalPlan() {
    setGoalMessage('')

    if (!isLoggedIn || !currentUserId || !supabase) {
      setGoalMessage('로그인 후 목표 대학을 저장할 수 있어.')
      return
    }
    if (!goalDraftUniversity) {
      setGoalMessage('희망 대학을 선택해줘.')
      return
    }
    if (!goalDraftDepartment) {
      setGoalMessage('희망 학과를 선택해줘.')
      return
    }

    try {
      const payload = {
        user_id: currentUserId,
        university: goalDraftUniversity,
        department: goalDraftDepartment,
        korean_grade: parseGoalGrade(goalDraftGrades.korean),
        math_grade: parseGoalGrade(goalDraftGrades.math),
        english_grade: parseGoalGrade(goalDraftGrades.english),
        inquiry1_grade: parseGoalGrade(goalDraftGrades.inquiry1),
        inquiry2_grade: parseGoalGrade(goalDraftGrades.inquiry2),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('goal_plans')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) throw error

      const next: GoalPlan = {
        university: goalDraftUniversity,
        department: goalDraftDepartment,
        grades: goalDraftGrades,
      }

      setGoalPlan(next)
      setGoalMessage('목표 대학 정보를 저장했어.')
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '알 수 없는 오류') : '알 수 없는 오류'
      setGoalMessage(`목표 대학 저장 실패: ${message}`)
    }
  }

  function openDropdownMenu(id: string) {
    if (closeDropdownTimer.current) {
      clearTimeout(closeDropdownTimer.current)
      closeDropdownTimer.current = null
    }
    setOpenDropdown(id)
  }

  function closeDropdownMenu(id: string) {
    if (closeDropdownTimer.current) {
      clearTimeout(closeDropdownTimer.current)
    }
    closeDropdownTimer.current = setTimeout(() => {
      setOpenDropdown((prev) => (prev === id ? null : prev))
    }, 180)
  }

  function isGroupActive(paths: readonly string[]) {
    if (paths.includes('/')) {
      return location.pathname === '/'
    }
    return paths.some((path) => {
      if (path === '/notice') return location.pathname === '/notice'
      return location.pathname === path || location.pathname.startsWith(`${path}/`)
    })
  }

  function DropdownNav({
    label,
    items,
    id,
  }: {
    label: string
    items: readonly (readonly [string, string])[]
    id: string
  }) {
    const active = isGroupActive(items.map((item) => item[1]))
    const opened = openDropdown === id

    return (
      <div
        className="relative pt-2"
        onMouseEnter={() => openDropdownMenu(id)}
        onMouseLeave={() => closeDropdownMenu(id)}
      >
        <button
          onClick={() => {
            if (opened) {
              closeDropdownMenu(id)
            } else {
              openDropdownMenu(id)
            }
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-semibold transition ${active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'}`}
        >
          <span>{label}</span>
          <span className={`text-xs transition ${opened ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {opened && (
          <div
            className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onMouseEnter={() => openDropdownMenu(id)}
            onMouseLeave={() => closeDropdownMenu(id)}
          >
            {items.map(([itemLabel, path], index) => (
              <button
                key={path}
                onClick={() => {
                  navigate(path)
                  setOpenDropdown(null)
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-700 ${index !== items.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <span>{itemLabel}</span>
                <span className="text-slate-300">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }



  function HomePage() {
    const goalLogo = goalPlan ? getUniversityLogo(goalPlan.university) : null
    const goalGradeRows = goalPlan
      ? [
          ['국어', currentSubjectSelections.korean, goalPlan.grades.korean],
          ['수학', currentSubjectSelections.math, goalPlan.grades.math],
          ['영어', currentSubjectSelections.english, goalPlan.grades.english],
          ['탐구1', currentSubjectSelections.inquiry1, goalPlan.grades.inquiry1],
          ['탐구2', currentSubjectSelections.inquiry2, goalPlan.grades.inquiry2],
        ] as const
      : []

    return (
      <div className="space-y-8">
        <section className="relative mx-auto min-h-[640px] max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-100 shadow-sm md:min-h-[720px]">
          <img
            src="/main-logo-flag.png"
            alt="청고정총 깃발"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(0deg,#ffffff_0%,rgba(255,255,255,0.96)_30%,rgba(255,255,255,0.72)_58%,rgba(255,255,255,0)_100%)]" />
          <div className="relative flex min-h-[640px] items-end px-8 pb-12 pt-64 md:min-h-[720px] md:px-14 md:pb-16 md:pt-80">
            <div className="max-w-4xl">
              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-7xl">
                청주고정시파이터총연맹
              </h1>
              <div className="mt-5 text-2xl font-black tracking-[0.32em] text-blue-700">청.고.정.총</div>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
                정시를 향해 함께 공부하고, 서로를 자극하며, 끝까지 흐름을 지켜내는 청주고 학습 공동체.
                기록보다 실력, 포장보다 축적, 흔들림보다 지속을 선택하는 사람들의 공간.
              </p>
            </div>
          </div>
        </section>

        {goalPlan && (
          <section className="mx-auto max-w-6xl rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {goalLogo && (
                <img src={goalLogo} alt={`${goalPlan.university} 로고`} className="h-24 w-24 rounded-[1.5rem] border border-slate-100 bg-white object-contain p-3 shadow-sm md:h-28 md:w-28" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">TARGET UNIVERSITY</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                  {(currentUsername || currentName || currentUserEmail.split('@')[0] || '회원')}님, {goalPlan.university}의 {goalPlan.department} 합격을 응원합니다!
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-5">
              {goalGradeRows.map(([label, subject, grade]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="text-xs font-semibold text-slate-500">{label} · {subject}</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{grade ? `${grade}등급` : '-'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {homeStudyStats.map(([eyebrow, value, desc], index) => (
            <div
              key={eyebrow}
              className={`rounded-[1.75rem] border p-6 shadow-sm ${index === 1 ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
            >
              <div className={`text-sm font-semibold tracking-[0.22em] ${index === 1 ? 'text-blue-100' : 'text-blue-700'}`}>{eyebrow}</div>
              <div className="mt-4 text-4xl font-black tracking-tight">{value}</div>
              <div className={`mt-3 text-sm leading-relaxed ${index === 1 ? 'text-blue-100' : 'text-slate-600'}`}>{desc}</div>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_48%,#1d4ed8_100%)] px-8 py-6 text-white md:px-10 md:py-7">
              <div className="absolute inset-y-0 right-0 w-40 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)]" />
              <div className="relative flex h-full flex-col justify-between gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="inline-flex items-center rounded-[1.1rem] bg-white px-4 py-2.5 text-2xl font-black tracking-tight text-blue-700 shadow-sm md:text-3xl">
                    고3
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tracking-[0.18em] text-blue-100">LIVE CUTLINE</div>
                    <div className="mt-2 text-base text-blue-100/90">2026년 5월 학력평가</div>
                  </div>
                </div>

                <div>
                  <div className="text-[4.25rem] font-black leading-none tracking-tight md:text-[5.75rem]">5.7</div>
                  <div className="mt-4 h-[3px] w-full max-w-[22rem] rounded-full bg-white/45" />
                  <div className="mt-4 text-3xl font-black tracking-tight md:text-4xl">학력평가</div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 md:px-10 md:py-7">
              <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">REALTIME CUTLINE</div>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">실시간 등급컷</h3>
              <div className="mt-3 text-xl font-medium tracking-tight text-slate-400 md:text-2xl">표준점수 기준</div>

              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
                <table className="min-w-full text-left">
                  <thead className="bg-[linear-gradient(180deg,#dbe7f7_0%,#d4e1f3_100%)] text-slate-800">
                    <tr className="border-b border-slate-200/80">
                      <th className="px-7 py-4 text-xl font-black">등급</th>
                      <th className="border-l border-white/60 px-7 py-4 text-xl font-black">국어</th>
                      <th className="border-l border-white/60 px-7 py-4 text-xl font-black">수학</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-slate-800">
                    {[
                      ['1등급', '129', '133'],
                      ['2등급', '124', '126'],
                      ['3등급', '118', '120'],
                    ].map((row, index, arr) => (
                      <tr key={row[0]} className={index !== arr.length - 1 ? 'border-b border-slate-200' : ''}>
                        <td className="px-7 py-5 text-2xl font-black tracking-tight text-blue-700">{row[0]}</td>
                        <td className="px-7 py-5 text-2xl font-medium tracking-tight text-slate-700">{row[1]}</td>
                        <td className="px-7 py-5 text-2xl font-medium tracking-tight text-slate-700">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <SectionShell
          eyebrow="SERVICE"
          title="청고정총 주요 서비스"
          description="정시 흐름을 유지하고, 필요한 정보를 바로 찾고, 공동체 안에서 학습 문화를 이어가기 위한 핵심 기능들이야."
          wide
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map(([title, desc, path]) => (
              <button
                key={title}
                onClick={() => navigate(path)}
                className="group rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"
              >
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">SERVICE</div>
                <div className="mt-4 text-2xl font-black tracking-tight text-slate-900">{title}</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-600">{desc}</div>
                <div className="mt-8 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition group-hover:bg-blue-700 group-hover:text-white group-hover:ring-blue-700">
                  바로가기
                </div>
              </button>
            ))}
          </div>
        </SectionShell>

        <section className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div className="border-b border-white/10 px-8 py-7 md:px-10">
            <div className="text-sm font-semibold tracking-[0.2em] text-blue-300">NUMBERS</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">숫자로 증명하는 정시</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
              청고정총이 지향하는 결과 중심 문화와 누적된 실적을 검은 배경의 메인 성과 보드로 정리했어.
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            {achievementCards.map(([title, desc, value], index) => (
              <div
                key={title}
                className={`relative overflow-hidden px-8 py-8 md:px-10 md:py-10 ${index === 0 ? 'border-b border-white/10 lg:border-b-0 lg:border-r' : 'border-b border-white/10'} lg:border-white/10`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_42%)]" />
                <div className="relative">
                  <div className="text-sm font-semibold tracking-[0.18em] text-blue-300">ACHIEVEMENT</div>
                  <div className="mt-4 text-2xl font-black leading-snug tracking-tight text-white md:text-3xl">{title}</div>
                  <div className="mt-3 text-base leading-relaxed text-slate-400">{desc}</div>
                  <div className="mt-10 flex items-end justify-between gap-4">
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Result</div>
                    <div className="text-5xl font-black tracking-tight text-blue-300 md:text-6xl">{value}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="relative lg:col-span-2">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(59,130,246,0.08))]" />
              <div className="relative px-8 py-8 md:px-10 md:py-10">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-sm font-semibold tracking-[0.18em] text-blue-300">ADMISSION</div>
                    <h3 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">2026년 입시 결과</h3>
                  </div>
                  <div className="text-sm text-slate-400">의예과 · 치의예과 · 약학과 · 반도체 계열 포함</div>
                </div>

                <div className="mt-8 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                  {admissionRows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                      <div className="text-sm font-medium text-slate-300 md:text-base">{label}</div>
                      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionShell
          eyebrow="COMMUNITY"
          title="청고정총 커뮤니티"
          description="정시를 준비하는 사람들의 분위기와 기록, 소통 채널을 연결하는 공간이야."
          wide
        >
          <div className="grid gap-5 md:grid-cols-3">
            {communityCards.map(([title, desc, path]) => (
              <button
                key={title}
                onClick={() => navigate(path)}
                className="group rounded-[1.8rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">COMMUNITY</div>
                    <div className="mt-4 text-2xl font-black tracking-tight text-slate-900">{title}</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-xl ring-1 ring-slate-200">
                    {title === '유튜브' ? '🎬' : title === '인스타그램' ? '📸' : '💬'}
                  </div>
                </div>
                <div className="mt-4 text-sm leading-relaxed text-slate-600">{desc}</div>
                <div className="mt-7 text-sm font-semibold text-slate-500 transition group-hover:text-blue-700">청고정총 연결 공간 보기</div>
              </button>
            ))}
          </div>
        </SectionShell>
      </div>
    )
  }

  function renderLoginRequiredPage() {
    return (
      <SectionShell eyebrow="LOGIN REQUIRED" title="로그인이 필요합니다" description="이 기능은 청고정총 회원만 이용할 수 있어. 로그인 후 다시 이용해줘.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <div className="text-base font-semibold text-slate-800">로그인 후 접근할 수 있는 기능입니다.</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            단체 소개와 공지사항을 제외한 서비스는 회원 전용으로 운영됩니다.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
          >
            로그인으로 이동
          </button>
        </div>
      </SectionShell>
    )
  }

  function renderApprovalRequiredPage() {
    return (
      <SectionShell eyebrow="APPROVAL REQUIRED" title="회원가입 승인 대기 중입니다" description="관리자 승인 전에는 일부 회원 전용 기능 이용이 제한됩니다. 승인이 완료되면 바로 이용할 수 있어요.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <div className="text-base font-semibold text-slate-800">아직 관리자 승인이 완료되지 않았습니다.</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            가입 정보 확인은 마이페이지에서 가능하고, 정시 정보·스터디·커뮤니티 같은 주요 기능은 승인 후 열립니다.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/mypage')}
              className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              마이페이지로 이동
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </SectionShell>
    )
  }

  function renderRejectedPage() {
    return (
      <SectionShell eyebrow="ACCOUNT LIMITED" title="회원가입 신청이 거절되었습니다" description="가입 승인 전과 동일하게 일부 회원 전용 기능 이용이 제한됩니다.">
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6">
          <div className="text-base font-semibold text-red-800">현재 계정은 승인 목록에서 거절 처리되었습니다.</div>
          <p className="mt-2 text-sm leading-relaxed text-red-700">
            거절 일시: {rejectedAt ? formatJoinedDate(rejectedAt) : '-'}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/mypage')}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              마이페이지로 이동
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-2xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </SectionShell>
    )
  }

  function renderSuspendedPage() {
    return (
      <SectionShell eyebrow="ACCOUNT LIMITED" title="회원 자격이 정지되었습니다" description="정지 기간에는 회원 전용 기능 이용이 제한됩니다.">
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6">
          <div className="text-base font-semibold text-red-800">현재 계정은 회원 자격 정지 상태입니다.</div>
          <p className="mt-2 text-sm leading-relaxed text-red-700">
            정지 기간: {currentSuspensionLabel}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/mypage')}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              마이페이지로 이동
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-2xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </SectionShell>
    )
  }

  function requireLogin(renderChildren: () => ReactNode) {
    if (!isLoggedIn) {
      return renderLoginRequiredPage()
    }

    return <>{renderChildren()}</>
  }

  function requireApproved(renderChildren: () => ReactNode) {
    if (!isLoggedIn) {
      return renderLoginRequiredPage()
    }
    if (isRejected) {
      return renderRejectedPage()
    }
    if (currentSuspensionActive) {
      return renderSuspendedPage()
    }
    if (!isApproved && !canManageApprovals) {
      return renderApprovalRequiredPage()
    }

    return <>{renderChildren()}</>
  }

  const loginPageElement = (
    <SectionShell
      eyebrow="AUTH"
      title="로그인"
      description="청고정총 홈페이지에 오신 것을 환영합니다!"
    >
      <div className="mx-auto max-w-xl rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">이메일</label>
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">비밀번호</label>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 outline-none transition focus:border-blue-400"
                placeholder="비밀번호"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500"
              >
                {showLoginPassword ? '숨김' : '보기'}
              </button>
            </div>
          </div>
          {loginMessage && <div className={`text-sm font-medium ${loginMessage.includes('성공') ? 'text-blue-700' : 'text-red-500'}`}>{loginMessage}</div>}
          <button
            onClick={handleSupabaseLogin}
            className="w-full rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
          >
            로그인
          </button>
          <div className="text-center text-sm text-slate-500">아직 회원이 아니신가요?</div>
          <button
            onClick={() => navigate('/signup')}
            className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
          >
            회원가입
          </button>
        </div>
      </div>
    </SectionShell>
  )

  const signupPageElement = (
    <SectionShell
      eyebrow="JOIN"
      title="회원가입"
      description="청고정총 홈페이지에 오신 것을 환영합니다!"
    >
      <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">이메일</label>
            <input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400" placeholder="example@email.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">아이디</label>
            <input value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400" placeholder="사이트에서 표시될 아이디" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">이름</label>
            <input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400" placeholder="이름" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">학년</label>
            <select value={signupGrade} onChange={(e) => setSignupGrade(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
              {['1', '2', '3'].map((n) => (
                <option key={n} value={n}>{n}학년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">반</label>
            <select value={signupClassNo} onChange={(e) => setSignupClassNo(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
              {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((n) => (
                <option key={n} value={n}>{n}반</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">번호</label>
            <input value={signupStudentNo} onChange={(e) => setSignupStudentNo(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400" placeholder="번호" inputMode="numeric" />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-1">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">비밀번호</label>
            <div className="relative">
              <input
                type={showSignupPassword ? 'text' : 'password'}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={`w-full rounded-2xl border bg-white px-4 py-3 pr-16 outline-none transition ${signupPassword.length > 0 && (signupPassword.length < 8 || signupPassword.length > 20) ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}
                placeholder="8자 이상 20자 이하"
              />
              <button type="button" onClick={() => setShowSignupPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                {showSignupPassword ? '숨김' : '보기'}
              </button>
            </div>
            {signupPassword.length > 0 && (signupPassword.length < 8 || signupPassword.length > 20) && <div className="mt-2 text-sm font-medium text-red-500">비밀번호는 8자 이상 20자 이하여야 합니다.</div>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">비밀번호 확인</label>
            <div className="relative">
              <input
                type={showSignupPasswordConfirm ? 'text' : 'password'}
                value={signupPasswordConfirm}
                onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                className={`w-full rounded-2xl border bg-white px-4 py-3 pr-16 outline-none transition ${signupPasswordConfirm.length > 0 && signupPassword !== signupPasswordConfirm ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}
                placeholder="비밀번호 재입력"
              />
              <button type="button" onClick={() => setShowSignupPasswordConfirm((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                {showSignupPasswordConfirm ? '숨김' : '보기'}
              </button>
            </div>
            {signupPasswordConfirm.length > 0 && signupPassword !== signupPasswordConfirm && <div className="mt-2 text-sm font-medium text-red-500">비밀번호가 서로 일치하지 않습니다.</div>}
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 md:p-6">
          <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">선택과목 설정</div>
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">국어 선택과목</label>
              <select value={signupSubjectSelections.korean} onChange={(e) => updateSignupSubject('korean', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
                {koreanOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">수학 선택과목</label>
              <select value={signupSubjectSelections.math} onChange={(e) => updateSignupSubject('math', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
                {mathOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">영어 응시 여부</label>
              <select value={signupSubjectSelections.english} onChange={(e) => updateSignupSubject('english', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
                {['응시함', '응시하지 않음'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">탐구 1</label>
              <select value={signupSubjectSelections.inquiry1} onChange={(e) => updateSignupSubject('inquiry1', e.target.value)} className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition ${signupSubjectSelections.inquiry1 !== '응시하지 않음' && signupSubjectSelections.inquiry2 !== '응시하지 않음' && signupSubjectSelections.inquiry1 === signupSubjectSelections.inquiry2 ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}>
                {['응시하지 않음', ...inquiryOptions].map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">탐구 2</label>
              <select value={signupSubjectSelections.inquiry2} onChange={(e) => updateSignupSubject('inquiry2', e.target.value)} className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition ${signupSubjectSelections.inquiry1 !== '응시하지 않음' && signupSubjectSelections.inquiry2 !== '응시하지 않음' && signupSubjectSelections.inquiry1 === signupSubjectSelections.inquiry2 ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}>
                {['응시하지 않음', ...inquiryOptions].map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">제2외국어 / 한문</label>
              <select value={signupSubjectSelections.secondForeign} onChange={(e) => updateSignupSubject('secondForeign', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
                {['응시하지 않음', '독일어Ⅰ', '프랑스어Ⅰ', '스페인어Ⅰ', '중국어Ⅰ', '일본어Ⅰ', '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ', '한문Ⅰ'].map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
          {signupSubjectSelections.inquiry1 !== '응시하지 않음' && signupSubjectSelections.inquiry2 !== '응시하지 않음' && signupSubjectSelections.inquiry1 === signupSubjectSelections.inquiry2 && <div className="mt-4 text-sm font-medium text-red-500">탐구 1과 탐구 2의 선택과목이 같습니다. 서로 다르게 선택해야 합니다.</div>}
        </div>

        {signupMessage && <div className={`mt-5 text-sm font-medium ${signupMessage.includes('완료') ? 'text-blue-700' : 'text-red-500'}`}>{signupMessage}</div>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleSupabaseSignup} className="rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
            회원가입 신청
          </button>
          <button onClick={() => navigate('/login')} className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
            로그인으로 이동
          </button>
        </div>
      </div>
    </SectionShell>
  )

  function JeongsiPage() {
    return (
      <div className="space-y-8">
        <SectionShell
          eyebrow="ALL ABOUT JEONGSI"
          title="All About 정시"
          description="정시 관련 핵심 기능과 자료들을 한 번에 모아보는 메인 페이지야. 풀서비스는 아래 카드로 들어가고, 일정은 아래에서 바로 확인할 수 있어."
        >
          <button
            onClick={() => navigate('/jeongsi-info/may-full-service')}
            className="w-full rounded-2xl bg-blue-700 px-6 py-4 text-center text-base font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
          >
            5월 학력평가 풀서비스
          </button>
        </SectionShell>

        <SectionShell
          eyebrow="SCHEDULE"
          title="모의고사 일정"
          description="연간 모의고사 일정을 한눈에 볼 수 있는 표야. 5월 23일 더프리미엄 모의고사도 반영해 두었어."
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-slate-800">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-base font-bold">시행월</th>
                    <th className="px-6 py-4 text-base font-bold">시행일</th>
                    <th className="px-6 py-4 text-base font-bold">주관</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-slate-700">
                  {mockSchedules.map((row, index) => (
                    <tr key={`${row[0]}-${row[1]}-${row[2]}`} className={index !== mockSchedules.length - 1 ? 'border-b border-slate-200' : ''}>
                      <td className="px-6 py-4 text-lg font-semibold">{row[0]}</td>
                      <td className="px-6 py-4 text-lg">{row[1]}</td>
                      <td className="px-6 py-4 text-lg">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionShell>
      </div>
    )
  }

  function MayFullServicePage() {
    return (
      <div className="space-y-8">
        <SectionShell
          eyebrow="MAY FULL SERVICE"
          title="5월 학력평가 풀서비스"
          description="등급컷 확인부터 성적 입력, 회원별 순위 비교까지 한 번에 볼 수 있는 페이지야. 이번 단계에서는 실제 로그인과 승인 상태 연동까지 붙여 두었고, 점수 저장은 다음 단계에서 DB에 연결할 거야."
          wide
        >
          <div className="space-y-8">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">CUTLINE</div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">등급컷</h2>
                </div>
                <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 md:block">5월 모의고사 기준</div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
                  <div className="text-lg font-bold text-slate-900">2026년 5월 학력평가 등급컷</div>
                  <div className="mt-1 text-sm text-slate-500">1등급 · 2등급 기준 원점수, 표준점수, 백분위 정리</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr className="border-b border-slate-200">
                        <th rowSpan={2} className="px-5 py-4 text-base font-bold md:px-6">과목</th>
                        <th colSpan={3} className="border-l border-slate-200 px-5 py-4 text-base font-bold md:px-6">1등급</th>
                        <th colSpan={3} className="border-l border-slate-200 px-5 py-4 text-base font-bold md:px-6">2등급</th>
                      </tr>
                      <tr className="border-b border-slate-200 text-sm">
                        <th className="border-l border-slate-200 px-5 py-3 font-semibold md:px-6">원점수</th>
                        <th className="px-5 py-3 font-semibold md:px-6">표준점수</th>
                        <th className="px-5 py-3 font-semibold md:px-6">백분위</th>
                        <th className="border-l border-slate-200 px-5 py-3 font-semibold md:px-6">원점수</th>
                        <th className="px-5 py-3 font-semibold md:px-6">표준점수</th>
                        <th className="px-5 py-3 font-semibold md:px-6">백분위</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-slate-800">
                      {cutlineRows.map((row, index) => (
                        <tr key={row[0]} className={index !== cutlineRows.length - 1 ? 'border-b border-slate-200' : ''}>
                          <td className="px-5 py-4 text-base font-semibold text-slate-700 md:px-6">{row[0]}</td>
                          <td className="border-l border-slate-200 px-5 py-4 md:px-6">{row[1]}</td>
                          <td className="px-5 py-4 md:px-6">{row[2]}</td>
                          <td className="px-5 py-4 md:px-6">{row[3]}</td>
                          <td className="border-l border-slate-200 px-5 py-4 md:px-6">{row[4]}</td>
                          <td className="px-5 py-4 md:px-6">{row[5]}</td>
                          <td className="px-5 py-4 md:px-6">{row[6]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">RANKING</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">회원별 성적 순위표</h2>
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-600">
                실제 점수 DB 저장과 정렬은 다음 단계에서 <code className="rounded bg-slate-50 px-1.5 py-0.5">score_entries</code> 테이블을 붙여 완성할 예정이야. 지금은 실제 로그인과 승인 구조를 먼저 붙여 둔 상태야.
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">INPUT</div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">성적 입력</h2>
                </div>
                <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 md:block">국어 · 영어 · 수학 · 한국사 · 탐구 1 · 탐구 2</div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6">
                {!isLoggedIn ? (
                  <div className="text-slate-500">로그인 후 이용할 수 있습니다.</div>
                ) : !isApproved ? (
                  <div className="text-slate-500">관리자 승인 후 성적 입력이 가능합니다.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">국어 선택과목</label>
                        <select value={scoreForm.koreanSubject} onChange={(e) => updateScoreField('koreanSubject', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
                          {koreanOptions.map((subject) => <option key={subject}>{subject}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">수학 선택과목</label>
                        <select value={scoreForm.mathSubject} onChange={(e) => updateScoreField('mathSubject', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400">
                          {mathOptions.map((subject) => <option key={subject}>{subject}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">탐구 1 선택과목</label>
                        <select value={scoreForm.inquiry1Subject} onChange={(e) => updateScoreField('inquiry1Subject', e.target.value)} className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition ${inquiryDuplicate ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}>
                          {inquiryOptions.map((subject) => <option key={subject}>{subject}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">탐구 2 선택과목</label>
                        <select value={scoreForm.inquiry2Subject} onChange={(e) => updateScoreField('inquiry2Subject', e.target.value)} className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition ${inquiryDuplicate ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}>
                          {inquiryOptions.map((subject) => <option key={subject}>{subject}</option>)}
                        </select>
                      </div>
                    </div>

                    {inquiryDuplicate && <div className="text-sm font-medium text-red-500">탐구 1과 탐구 2 과목은 서로 다르게 선택해야 합니다.</div>}

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        ['korean', '국어 점수'],
                        ['english', '영어 점수'],
                        ['math', '수학 점수'],
                        ['koreanHistory', '한국사 점수'],
                        ['inquiry1', '탐구 1 점수'],
                        ['inquiry2', '탐구 2 점수'],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
                          <input
                            value={scoreForm[field as keyof ScoreForm]}
                            onChange={(e) => updateScoreField(field as keyof ScoreForm, e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-400"
                            placeholder="숫자 입력"
                            inputMode="numeric"
                          />
                        </div>
                      ))}
                    </div>

                    {scoreMessage && <div className={`text-sm font-medium ${scoreMessage.includes('예정') ? 'text-blue-700' : 'text-red-500'}`}>{scoreMessage}</div>}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        현재 합계 예상 점수: <span className="font-black text-slate-900">{predictedTotal}</span>
                      </div>
                      <button onClick={handleFakeScoreSave} className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
                        성적 저장하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionShell>
      </div>
    )
  }

  function MyPage() {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />
    }

    const membershipStatus = isRejected
      ? '가입 거절'
      : currentSuspensionActive
        ? `정지 중 · ${currentSuspensionLabel}`
        : isApproved
          ? '정상'
          : '승인 대기'

    const accountRows = [
      ['아이디', currentUsername || '-'],
      ['현재 등급', getRoleLabel(currentRole, isApproved)],
      ['회원 상태', membershipStatus],
      ['학번 정보', [currentGrade, currentClassNo, currentStudentNo].every((value) => value !== null) ? `${currentGrade}학년 ${currentClassNo}반 ${currentStudentNo}번` : '-'],
      ['가입일', formatJoinedDate(currentJoinedAt)],
    ] as const

    const subjectRows = [
      ['국어', currentSubjectSelections.korean],
      ['수학', currentSubjectSelections.math],
      ['영어', currentSubjectSelections.english],
      ['탐구1', currentSubjectSelections.inquiry1],
      ['탐구2', currentSubjectSelections.inquiry2],
      ['제2외국어', currentSubjectSelections.secondForeign],
    ] as const
    const universityMatches = universityDepartments
      .filter((entry) => entry.university.includes(goalUniversitySearch.trim()))
      .slice(0, 8)
    const selectedUniversityEntry = universityDepartments.find((entry) => entry.university === goalDraftUniversity)
    const selectedUniversityLogo = getUniversityLogo(goalDraftUniversity)
    const goalGradeInputs = [
      ['국어', currentSubjectSelections.korean, 'korean'],
      ['수학', currentSubjectSelections.math, 'math'],
      ['영어', currentSubjectSelections.english, 'english'],
      ['탐구1', currentSubjectSelections.inquiry1, 'inquiry1'],
      ['탐구2', currentSubjectSelections.inquiry2, 'inquiry2'],
    ] as Array<[string, string, keyof GoalGrades]>

    return (
      <SectionShell eyebrow="PROFILE" title={currentUsername || currentUserEmail || '내 정보'} description="계정 정보와 선택과목을 확인하고 수정할 수 있는 페이지야." wide>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">계정 정보</div>
              <div className="mt-4 space-y-3">
                {accountRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">선택과목 설정</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {subjectRows.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">{label}</div>
                    <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold tracking-[0.16em] text-blue-700">TARGET UNIVERSITY</div>
              <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">희망 대학</div>
              {goalPlan ? (
                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  {getUniversityLogo(goalPlan.university) && (
                    <img src={getUniversityLogo(goalPlan.university) ?? ''} alt={`${goalPlan.university} 로고`} className="h-14 w-14 rounded-2xl border border-slate-100 object-contain p-2" />
                  )}
                  <div>
                    <div className="text-lg font-black text-slate-900">{goalPlan.university}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">{goalPlan.department}학과</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">아직 저장된 희망 대학이 없어.</div>
              )}
            </div>

            <button onClick={handleLogout} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-red-300 hover:text-red-700">
              로그아웃
            </button>
            {canManageApprovals && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => navigate('/admin/approvals')} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">
                  회원가입 승인
                </button>
                <button onClick={() => navigate('/admin/members')} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100">
                  회원 관리
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">희망 대학 선택</div>
              <div className="mt-4 space-y-4">
                <div className="relative">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">대학 검색</label>
                  <input
                    value={goalUniversitySearch}
                    onFocus={() => {
                      if (goalUniversitySearch.trim()) setGoalUniversityDropdownOpen(true)
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setGoalUniversityDropdownOpen(false), 120)
                    }}
                    onChange={(e) => {
                      setGoalUniversitySearch(e.target.value)
                      setGoalUniversityDropdownOpen(true)
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="예: 서울대학교"
                  />
                  {goalUniversityDropdownOpen && goalUniversitySearch.trim() && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                      {universityMatches.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-slate-500">검색 결과가 없어.</div>
                      ) : (
                        universityMatches.map((entry) => {
                          const logo = getUniversityLogo(entry.university)
                          return (
                            <button
                              key={entry.university}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                setGoalDraftUniversity(entry.university)
                                setGoalUniversitySearch(entry.university)
                                setGoalUniversityDropdownOpen(false)
                                setGoalDraftDepartment('')
                              }}
                              className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold transition last:border-b-0 hover:bg-blue-50 ${goalDraftUniversity === entry.university ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                            >
                              {logo && <img src={logo} alt="" className="h-9 w-9 rounded-xl border border-slate-100 object-contain p-1" />}
                              <span>{entry.university}</span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {goalDraftUniversity && (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      {selectedUniversityLogo && <img src={selectedUniversityLogo} alt={`${goalDraftUniversity} 로고`} className="h-12 w-12 rounded-2xl border border-slate-100 bg-white object-contain p-2" />}
                      <div>
                        <div className="text-sm font-semibold text-blue-700">선택 대학</div>
                        <div className="text-lg font-black text-slate-900">{goalDraftUniversity}</div>
                      </div>
                    </div>
                    <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">학과 선택</label>
                    <select
                      value={goalDraftDepartment}
                      onChange={(e) => setGoalDraftDepartment(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                    >
                      <option value="">학과를 선택해줘</option>
                      {(selectedUniversityEntry?.departments ?? []).map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold tracking-[0.16em] text-blue-700">TARGET GRADE</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {goalGradeInputs.map(([label, subject, field]) => (
                      <div key={field} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <label className="block text-xs font-semibold text-slate-500">{label} · {subject}</label>
                        <input
                          value={goalDraftGrades[field]}
                          onChange={(e) => handleGoalGradeChange(field, e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none transition focus:border-blue-400 focus:bg-white"
                          placeholder="목표 등급"
                          inputMode="numeric"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {goalMessage && <div className={`text-sm font-medium ${goalMessage.includes('저장했어') ? 'text-blue-700' : 'text-red-500'}`}>{goalMessage}</div>}
                <button onClick={handleSaveGoalPlan} className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
                  목표 대학 저장
                </button>
              </div>
            </div>

            <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">정보 수정</div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">아이디</label>
                <input value={profileEditUsername} onChange={(e) => setProfileEditUsername(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">새 비밀번호</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white">
                    <input type={showProfilePassword ? 'text' : 'password'} value={profileEditPassword} onChange={(e) => setProfileEditPassword(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="변경할 때만 입력" />
                    <button type="button" onClick={() => setShowProfilePassword((prev) => !prev)} className="text-xs font-semibold text-slate-500">{showProfilePassword ? '숨기기' : '보기'}</button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">비밀번호 확인</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white">
                    <input type={showProfilePasswordConfirm ? 'text' : 'password'} value={profileEditPasswordConfirm} onChange={(e) => setProfileEditPasswordConfirm(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="한 번 더 입력" />
                    <button type="button" onClick={() => setShowProfilePasswordConfirm((prev) => !prev)} className="text-xs font-semibold text-slate-500">{showProfilePasswordConfirm ? '숨기기' : '보기'}</button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['국어', 'korean', koreanOptions],
                  ['수학', 'math', mathOptions],
                  ['영어', 'english', ['응시함', '응시하지 않음']],
                  ['탐구1', 'inquiry1', ['응시하지 않음', ...inquiryOptions]],
                  ['탐구2', 'inquiry2', ['응시하지 않음', ...inquiryOptions]],
                  ['제2외국어', 'secondForeign', ['응시하지 않음', '일본어Ⅰ', '중국어Ⅰ', '한문Ⅰ', '프랑스어Ⅰ', '독일어Ⅰ', '스페인어Ⅰ', '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ']],
                ] as Array<[string, keyof SignupSubjectSelections, string[]]>).map(([label, field, options]) => (
                  <div key={String(field)}>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{String(label)}</label>
                    <select
                      value={profileEditSubjects[field as keyof SignupSubjectSelections]}
                      onChange={(e) => setProfileEditSubjects((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                    >
                      {(options as string[]).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            {profileEditMessage && <div className={`text-sm font-medium ${profileEditMessage.includes('수정했어') ? 'text-blue-700' : 'text-red-500'}`}>{profileEditMessage}</div>}
            <button onClick={handleProfileSave} disabled={profileSaving} className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {profileSaving ? '저장 중...' : '프로필 수정 저장'}
            </button>
          </div>
        </div>
      </SectionShell>
    )
  }

  function AdminApprovalsPage() {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />
    }

    if (!canManageApprovals) {
      return (
        <SectionShell eyebrow="ADMIN" title="회원가입 승인" description="관리자 또는 부관리자 권한이 있는 계정만 접근할 수 있는 페이지야.">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">관리자 권한이 확인되지 않았습니다.</div>
        </SectionShell>
      )
    }

    return (
      <SectionShell eyebrow="ADMIN" title="회원가입 승인" description="승인 대기 중인 회원을 확인하고 가입을 승인할 수 있는 관리자 화면이야. 부관리자도 이 화면을 이용할 수 있어." wide>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-500">
              승인 대기 회원 <span className="text-blue-700">{approvalProfiles.length}</span>명
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/admin/members')}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
              >
                회원 관리
              </button>
              <button
                onClick={fetchApprovalProfiles}
                disabled={approvalLoading}
                className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approvalLoading ? '새로고침 중...' : '목록 새로고침'}
              </button>
            </div>
          </div>

          {approvalMessage && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${approvalMessage.includes('완료') || approvalMessage.includes('거절했습니다') ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-red-100 bg-red-50 text-red-600'}`}>
              {approvalMessage}
            </div>
          )}

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            {approvalLoading && approvalProfiles.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">승인 대기 회원을 불러오는 중...</div>
            ) : approvalProfiles.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">현재 승인 대기 중인 회원이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-4 text-sm font-bold">아이디</th>
                      <th className="px-5 py-4 text-sm font-bold">권한</th>
                      <th className="px-5 py-4 text-sm font-bold">가입일</th>
                      <th className="px-5 py-4 text-sm font-bold">상세</th>
                      <th className="px-5 py-4 text-sm font-bold">처리</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {approvalProfiles.map((profile, index) => {
                      const expanded = expandedApprovalProfileId === profile.id
                      const subjectRows = getProfileSubjectRows(profile)

                      return (
                        <Fragment key={profile.id}>
                          <tr className={index !== approvalProfiles.length - 1 || expanded ? 'border-b border-slate-200' : ''}>
                            <td className="px-5 py-4 text-sm font-bold text-slate-900">{profile.username || '-'}</td>
                            <td className="px-5 py-4 text-sm">{getRoleLabel(normalizeUserRole(profile.role, profile.is_admin), Boolean(profile.is_approved))}</td>
                            <td className="px-5 py-4 text-sm">{formatJoinedDate(profile.created_at ?? '')}</td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setExpandedApprovalProfileId((prev) => (prev === profile.id ? null : profile.id))}
                                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                              >
                                {expanded ? '접기' : '상세'}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleApproveProfile(profile.id)}
                                disabled={approvingProfileId === profile.id || rejectingProfileId === profile.id}
                                className="rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {approvingProfileId === profile.id ? '승인 중...' : '승인'}
                              </button>
                                <button
                                  onClick={() => handleRejectProfile(profile.id)}
                                  disabled={approvingProfileId === profile.id || rejectingProfileId === profile.id}
                                  className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {rejectingProfileId === profile.id ? '거절 중...' : '거절'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className={index !== approvalProfiles.length - 1 ? 'border-b border-slate-200' : ''}>
                              <td colSpan={5} className="bg-slate-50 px-5 py-5">
                                <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-semibold tracking-[0.16em] text-blue-700">PROFILE</div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      {[
                                        ['이름', profile.name || '-'],
                                        ['학번', formatStudentInfo(profile)],
                                        ['이메일', profile.email || '-'],
                                        ['가입일', formatJoinedDate(profile.created_at ?? '')],
                                      ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                                          <div className="text-xs font-semibold text-slate-500">{label}</div>
                                          <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-semibold tracking-[0.16em] text-blue-700">SUBJECTS</div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                      {subjectRows.map(([label, value]) => (
                                        <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                                          <div className="text-xs font-semibold text-slate-500">{label}</div>
                                          <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
	                </table>
	              </div>
	            )}
	          </div>
            {suspensionProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8">
                <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-2xl">
                  <div className="text-sm font-semibold tracking-[0.16em] text-red-600">MEMBERSHIP</div>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">회원 자격 박탈</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {suspensionProfile.username || suspensionProfile.name || '회원'}님의 정지 기간을 선택해주세요.
                  </p>

                  <label className="mt-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <input
                      type="checkbox"
                      checked={suspensionPermanent}
                      onChange={(e) => setSuspensionPermanent(e.target.checked)}
                      className="h-4 w-4 accent-red-600"
                    />
                    영구정지
                  </label>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">시작일</label>
                      <input
                        type="date"
                        value={suspensionStartsAt}
                        onChange={(e) => setSuspensionStartsAt(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-red-300 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">종료일</label>
                      <input
                        type="date"
                        value={suspensionEndsAt}
                        onChange={(e) => setSuspensionEndsAt(e.target.value)}
                        disabled={suspensionPermanent}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-red-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSuspensionProfile(null)}
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSuspendProfile()}
                      disabled={suspendingProfileId === suspensionProfile.id}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {suspendingProfileId === suspensionProfile.id ? '처리 중...' : '박탈 적용'}
                    </button>
                  </div>
                </div>
              </div>
            )}
	        </div>
	      </SectionShell>
	    )
  }
  function MemberManagementPage() {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />
    }

    if (!canManageApprovals) {
      return (
        <SectionShell eyebrow="ADMIN" title="회원 관리" description="관리자 또는 부관리자 권한이 있는 계정만 접근할 수 있는 페이지야.">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">회원 관리 권한이 확인되지 않았습니다.</div>
        </SectionShell>
      )
    }

    const editableRoleOptions = getEditableRoleOptions()

    return (
      <SectionShell eyebrow="ADMIN" title="회원 관리" description="승인 완료된 회원의 등급과 회원 자격을 관리하는 화면이야. 부관리자는 일반 회원만, 관리자는 부관리자까지 관리할 수 있어." wide>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-500">
              관리 가능 회원 <span className="text-blue-700">{memberProfiles.length}</span>명
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/admin/approvals')}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
              >
                회원가입 승인
              </button>
              <button
                onClick={fetchMemberProfiles}
                disabled={memberLoading}
                className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {memberLoading ? '새로고침 중...' : '목록 새로고침'}
              </button>
            </div>
          </div>

          {memberMessage && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${memberMessage.includes('변경했습니다') || memberMessage.includes('완료되었습니다') ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-red-100 bg-red-50 text-red-600'}`}>
              {memberMessage}
            </div>
          )}

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            {memberLoading && memberProfiles.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">회원 목록을 불러오는 중...</div>
            ) : memberProfiles.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">현재 관리 가능한 승인 회원이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-4 text-sm font-bold">아이디</th>
                      <th className="px-5 py-4 text-sm font-bold">이름</th>
                      <th className="px-5 py-4 text-sm font-bold">등급</th>
                      <th className="px-5 py-4 text-sm font-bold">회원 자격</th>
                      <th className="px-5 py-4 text-sm font-bold">가입일</th>
                      <th className="px-5 py-4 text-sm font-bold">상세</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {memberProfiles.map((profile, index) => {
                      const role = normalizeUserRole(profile.role, profile.is_admin)
                      const expanded = expandedMemberProfileId === profile.id
                      const editable = canEditMemberProfile(profile)
                      const suspensionActive = isSuspensionActive(profile)
                      const suspensionLabel = getSuspensionLabel(profile)
                      const subjectRows = getProfileSubjectRows(profile)

                      return (
                        <Fragment key={profile.id}>
                          <tr className={index !== memberProfiles.length - 1 || expanded ? 'border-b border-slate-200' : ''}>
	                            <td className="px-5 py-4 text-sm font-bold text-slate-900">{profile.username || '-'}</td>
	                            <td className="px-5 py-4 text-sm">{profile.name || '-'}</td>
	                            <td className="px-5 py-4">
                                <select
                                  value={role}
                                  onChange={(e) => void handleRoleChange(profile, e.target.value as UserRole)}
                                  disabled={!editable || updatingRoleProfileId === profile.id}
                                  className="min-w-32 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {editableRoleOptions.map((option) => (
                                    <option key={option} value={option}>{getRoleLabel(option, true)}</option>
                                  ))}
                                </select>
                                {!editable && <div className="mt-1 text-xs font-semibold text-slate-400">수정 불가</div>}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex min-w-40 flex-col items-start gap-2">
                                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${suspensionActive ? 'bg-red-50 text-red-700 ring-1 ring-red-100' : 'bg-slate-100 text-slate-600'}`}>
                                    {suspensionLabel}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openSuspensionDialog(profile)}
                                    disabled={!editable || suspendingProfileId === profile.id}
                                    className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {suspendingProfileId === profile.id ? '처리 중...' : '회원 자격 박탈'}
                                  </button>
                                </div>
                              </td>
	                            <td className="px-5 py-4 text-sm">{formatJoinedDate(profile.created_at ?? '')}</td>
	                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setExpandedMemberProfileId((prev) => (prev === profile.id ? null : profile.id))}
                                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                              >
                                {expanded ? '접기' : '상세'}
                              </button>
                            </td>
	                          </tr>
	                          {expanded && (
	                            <tr className={index !== memberProfiles.length - 1 ? 'border-b border-slate-200' : ''}>
	                              <td colSpan={6} className="bg-slate-50 px-5 py-5">
	                                <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-semibold tracking-[0.16em] text-blue-700">PROFILE</div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      {[
	                                        ['학번', formatStudentInfo(profile)],
	                                        ['이메일', profile.email || '-'],
	                                        ['등급', getRoleLabel(role, true)],
                                          ['회원 자격', suspensionLabel],
	                                        ['가입일', formatJoinedDate(profile.created_at ?? '')],
                                      ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                                          <div className="text-xs font-semibold text-slate-500">{label}</div>
                                          <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-semibold tracking-[0.16em] text-blue-700">SUBJECTS</div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                      {subjectRows.map(([label, value]) => (
                                        <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                                          <div className="text-xs font-semibold text-slate-500">{label}</div>
                                          <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SectionShell>
    )
  }

  function NoticePage() {
    return (
      <SectionShell
        eyebrow="NOTICE"
        title="공지사항"
        description="청고정총의 공식 공지와 일정, 운영 관련 안내를 모아두는 공간이야."
      >
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">공지사항 상세 콘텐츠는 다음 단계에서 실제 데이터베이스와 연결할 예정이야.</div>
      </SectionShell>
    )
  }

  function ChairmanPage() {
    return (
      <div className="space-y-8">
        <SectionShell
          eyebrow="ABOUT"
          title="회장 인삿말"
          description="청고정총 메인페이지의 디자인 결을 이어받아, 회장 소개와 약력, 인삿말을 정리한 페이지야."
          wide
        >
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="overflow-visible rounded-[1.9rem] border border-slate-200 bg-white shadow-sm">
                <div className="rounded-t-[1.9rem] bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_52%,#1d4ed8_100%)] px-6 py-7 text-white md:px-8 md:py-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold tracking-[0.18em] text-blue-100">PROFILE</div>
                      <div className="mt-4 text-4xl font-black tracking-tight md:text-5xl">장주헌</div>
                      <div className="mt-3 text-lg font-medium text-blue-100">청주고정시파이터총연합 1대 회장</div>
                    </div>
                    <img
                      src="/chairman.png"
                      alt="장주헌 회장"
                      className="-mb-14 h-36 w-36 rounded-[1.5rem] border-4 border-white bg-white object-cover shadow-2xl shadow-blue-950/25 sm:-mr-2 sm:h-44 sm:w-44"
                    />
                  </div>
                </div>
                <div className="px-6 pb-6 pt-20 md:px-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold tracking-[0.18em] text-blue-700">POSITION</div>
                      <div className="mt-3 text-lg font-black tracking-tight text-slate-900">1대 회장</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold tracking-[0.18em] text-blue-700">FOCUS</div>
                      <div className="mt-3 text-lg font-black tracking-tight text-slate-900">정시 공동체 운영</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 md:px-8">
                  <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">BIOGRAPHY</div>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">회장 약력</h3>
                </div>
                <div className="px-6 py-6 md:px-8">
                  <div className="space-y-4">
                    {[
                      ['청주고정시파이터총연합 1대 회장', '청고정총 창립 및 초기 운영 총괄'],
                      ['정시 학습 공동체 기획', '정시 중심 학습 문화와 운영 방향 설계'],
                      ['서비스 구조 초안 제안', 'All About 정시, study with 정시 등 핵심 서비스 기획 참여'],
                      ['공동체 운영 방향 제시', '실력 중심 · 지속 중심의 분위기 형성 주도'],
                    ].map(([title, desc]) => (
                      <div key={title} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                        <div className="text-base font-black tracking-tight text-slate-900">{title}</div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-slate-50 shadow-sm">
              <div className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">1ST PRESIDENT</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">인삿말</h2>
                <div className="mt-3 text-sm font-medium text-slate-500">Cheonggo Jeongchong Chairman Message</div>
              </div>

              <div className="px-6 py-7 md:px-8 md:py-8">
                <div className="space-y-5 text-base leading-8 text-slate-700">
                  <p>안녕하십니까. 청주고정시파이터총연합 1대 회장 장주헌입니다.</p>

                  <p>
                    청고정총은 단순히 정시를 준비하는 학생들의 모임이 아니라, 같은 목표를 향해 묵묵히 나아가는 사람들의 흐름을
                    만들기 위해 시작된 공동체입니다. 정시라는 길은 결코 가볍지 않으며, 긴 시간 동안 스스로를 다잡고 끝까지
                    흔들리지 않는 태도가 필요합니다. 그래서 저는 혼자 버티는 공부보다, 함께 분위기를 만들고 서로를 자극하며
                    끝까지 밀고 나아가는 공부가 더 큰 힘을 가진다고 믿습니다.
                  </p>

                  <p>
                    청고정총이 지향하는 가치는 분명합니다. 보여주기보다 실력, 순간의 의욕보다 지속, 말보다 축적입니다. 우리는
                    화려한 포장보다 실제 공부의 시간과 결과를 더 중요하게 생각합니다. 오늘 하루의 집중, 오늘 풀어낸 문제 한
                    개, 오늘 끝까지 버텨낸 한 시간이 결국 각자의 미래를 만든다고 생각하기 때문입니다.
                  </p>

                  <p>
                    이 공간은 정시를 준비하는 학생들이 서로의 경쟁자인 동시에 서로를 성장시키는 동료가 될 수 있도록 만들고
                    싶었습니다. 필요한 정보를 빠르게 찾을 수 있고, 공부의 흐름을 유지할 수 있으며, 같은 길을 걷는 사람들의
                    분위기를 느낄 수 있는 곳. 청고정총은 그런 역할을 하는 공동체가 되고자 합니다.
                  </p>

                  <p>
                    앞으로도 청고정총은 정시를 향한 의지를 함께 나누고, 끝까지 포기하지 않는 태도를 지켜가는 공간이 되도록
                    노력하겠습니다. 이곳에 모인 모든 사람이 자신의 목표를 끝내 실력으로 증명해내길 바랍니다. 그리고 그 길 위에서
                    청고정총이 분명한 동기와 힘이 되기를 바랍니다.
                  </p>

                  <p className="font-semibold text-slate-900">감사합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionShell>
      </div>
    )
  }

  function OrganizationPage() {
    return (
      <SectionShell eyebrow="ABOUT" title="단체 소개" description="청고정총의 목표, 운영 방식, 문화와 활동을 소개하는 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">단체 소개 콘텐츠를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  function SymbolPage() {
    return (
      <SectionShell eyebrow="ABOUT" title="상징 소개" description="청고정총의 이름, 로고, 상징 색상과 의미를 소개하는 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">상징 소개 콘텐츠를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  function LocationPage() {
    return (
      <SectionShell eyebrow="ABOUT" title="찾아 오시는 길" description="청주고등학교 위치와 주변 방향을 확인할 수 있는 안내 페이지야." wide>
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 md:p-7">
            <div className="text-sm font-semibold tracking-[0.16em] text-blue-700">ADDRESS</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">청주고등학교</div>
            <div className="mt-3 text-base leading-relaxed text-slate-700">
              (우:28573) 충청북도 청주시 흥덕구 사직대로 79
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 md:px-7">
              <div className="text-sm font-semibold tracking-[0.16em] text-blue-700">LOCATION MAP</div>
              <div className="mt-2 text-xl font-black tracking-tight text-slate-900">약도</div>
            </div>
            <div className="bg-white p-3 md:p-5">
              <img
                src="/location-map.png"
                alt="청주고등학교 약도"
                className="w-full rounded-[1.1rem] border border-slate-100 object-contain"
              />
            </div>
          </div>
        </div>
      </SectionShell>
    )
  }

  function StudyWithJeongsiPage() {
    const maxSubjectSeconds = Math.max(...Object.values(subjectSeconds), 1)

    async function handleToggleStudyTimer() {
      if (!isLoggedIn || !currentUserId) {
        setStudySyncMessage('로그인 후 이용할 수 있어.')
        return
      }

      const nextRunning = !studyRunning
      setStudyRunning(nextRunning)
      try {
        await persistStudyTimerState({
          currentSeconds: studySeconds,
          isRunning: nextRunning,
          currentSubject: currentStudySubject,
          subjectTotals: subjectSeconds,
        })
        await fetchStudyLeaderboard()
        setStudySyncMessage('')
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        setStudySyncMessage(`타이머 상태를 동기화하지 못했습니다: ${message}`)
      }
    }

    async function handleResetStudyTimer() {
      if (!isLoggedIn || !currentUserId) {
        setStudySyncMessage('로그인 후 이용할 수 있어.')
        return
      }

      const empty = createEmptySubjectSeconds()
      try {
        await resetCurrentUserStudyTimerState(currentStudySubject, empty)
        setStudyRunning(false)
        setStudySeconds(0)
        setSubjectSeconds(empty)
        studySnapshotRef.current = {
          currentSeconds: 0,
          isRunning: false,
          currentSubject: currentStudySubject,
          subjectTotals: empty,
        }
        setStudySyncMessage('')
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        setStudySyncMessage(`타이머 상태를 동기화하지 못했습니다: ${message}`)
      }
    }

    async function handleSubjectChange(subject: (typeof studySubjectOptions)[number]) {
      setCurrentStudySubject(subject)
      try {
        await persistStudyTimerState({
          currentSeconds: studySeconds,
          isRunning: studyRunning,
          currentSubject: subject,
          subjectTotals: subjectSeconds,
        })
        await fetchStudyLeaderboard()
        setStudySyncMessage('')
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        setStudySyncMessage(`타이머 상태를 동기화하지 못했습니다: ${message}`)
      }
    }

    return (
      <SectionShell eyebrow="SERVICE" title="study with 정시" description="타이머를 켜고 지금 공부 중인 과목과 누적 시간을 같이 관리하는 페이지야." wide>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div className="rounded-[1.5rem] bg-slate-950 px-6 py-8 text-white shadow-lg">
              <div className="text-sm font-semibold tracking-[0.18em] text-blue-200">LIVE TIMER</div>
              <div className="mt-4 text-5xl font-black tracking-tight md:text-6xl">{formatStudyDuration(studySeconds)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/15 px-3 py-1">현재 과목 · {currentStudySubject}</span>
                <span className={`rounded-full px-3 py-1 ${studyRunning ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>{studyRunning ? '공부 중' : '일시정지'}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleToggleStudyTimer}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${studyRunning ? 'border border-white/15 bg-white/10 hover:bg-white/15' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  {studyRunning ? '일시정지' : '시작'}
                </button>
                <button onClick={handleResetStudyTimer} className="rounded-2xl border border-red-300/30 px-5 py-3 text-sm font-semibold text-red-100 hover:bg-red-400/10">초기화</button>
              </div>
              {studySyncMessage && <p className="mt-4 text-sm text-amber-200">{studySyncMessage}</p>}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">현재 공부 과목 설정</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {studySubjectOptions.map((subject) => {
                  const active = subject === currentStudySubject
                  return (
                    <button
                      key={subject}
                      onClick={() => handleSubjectChange(subject)}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${active ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/20' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:text-blue-700'}`}
                    >
                      {subject}
                    </button>
                  )
                })}
              </div>

              <div className="mt-8">
                <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">과목별 공부 시간</div>
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {studySubjectOptions.map((subject) => {
                    const seconds = subjectSeconds[subject] ?? 0
                    const height = Math.max((seconds / maxSubjectSeconds) * 100, seconds > 0 ? 14 : 6)
                    const active = subject === currentStudySubject

                    return (
                      <div key={subject} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
                        <div className="flex h-40 items-end justify-center">
                          <div className="flex h-full w-full items-end justify-center rounded-[1rem] bg-white px-2 py-2">
                            <div
                              className={`w-full rounded-t-2xl transition-all ${active ? 'bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 shadow-lg shadow-blue-200/80' : 'bg-gradient-to-t from-slate-500 via-slate-400 to-slate-300'}`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <div className={`text-sm font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{subject}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{formatStudyDuration(seconds)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

	          <div>
	            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-[0.16em] text-slate-500">LIVE BOARD</div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">실시간 공부 리더보드</h2>
                </div>
                <button onClick={() => void fetchStudyLeaderboard()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">새로고침</button>
              </div>

              <div className="mt-5 space-y-3">
                {displayStudyLeaderboard.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">아직 표시할 타이머가 없어.</div>
	                ) : (
	                  displayStudyLeaderboard.map((row, index) => {
	                    const displayId = (row.username || '').trim() ? String(row.username).trim() : 'unknown'
	                    const rank = index + 1
	                    const isTop = index === 0
	                    const previewOpen = leaderboardPreviewUserId === row.user_id
	                    const previewSubjectSeconds = normalizeSubjectSeconds(row.subject_seconds)
	                    const previewMaxSubjectSeconds = Math.max(...Object.values(previewSubjectSeconds), 1)
	                    return (
	                      <div
	                        key={row.user_id}
	                        className="relative"
	                        onMouseEnter={() => setLeaderboardPreviewUserId(row.user_id)}
	                        onMouseLeave={() => setLeaderboardPreviewUserId(null)}
	                      >
	                        <button
	                          onClick={() => {
	                            setSelectedLeaderboardUserId(row.user_id)
	                            setLeaderboardPreviewUserId(row.user_id)
	                          }}
	                          onFocus={() => setLeaderboardPreviewUserId(row.user_id)}
	                          onBlur={() => setLeaderboardPreviewUserId(null)}
	                          className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${row.user_id === selectedLeaderboardUserId ? 'ring-2 ring-blue-300' : ''} ${isTop ? 'border-amber-300 bg-amber-50 shadow-lg shadow-amber-100' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'}`}
	                        >
	                          <div className="flex items-start justify-between gap-4">
	                            <div>
	                              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${isTop ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-600'}`}>#{rank}</div>
	                              <div className={`mt-3 text-lg font-black tracking-tight ${isTop ? 'text-amber-950' : 'text-slate-900'}`}>{displayId.includes('@') ? displayId.split('@')[0] : displayId}</div>
	                              <div className="mt-1 text-sm text-slate-500">{row.current_subject || '과목 미설정'} · {row.is_running ? '공부 중' : '대기 중'}</div>
	                            </div>
	                            <div className={`text-right text-2xl font-black tracking-tight ${isTop ? 'text-amber-700' : 'text-blue-700'}`}>{formatStudyDuration(Number(row.current_seconds ?? 0))}</div>
	                          </div>
	                        </button>

	                        {previewOpen && (
	                          <div className="absolute bottom-[calc(100%+0.55rem)] right-0 z-30 w-[min(22rem,calc(100vw-3rem))] rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left shadow-2xl shadow-slate-300/50">
	                            <div className="flex items-start justify-between gap-3">
	                              <div>
	                                <div className="text-xs font-semibold tracking-[0.16em] text-blue-700">STUDY DETAIL</div>
	                                <div className="mt-1 text-lg font-black tracking-tight text-slate-900">{displayId.includes('@') ? displayId.split('@')[0] : displayId}</div>
	                              </div>
	                              <div className="text-right text-sm font-black text-blue-700">{formatStudyDuration(Number(row.current_seconds ?? 0))}</div>
	                            </div>
	                            <div className="mt-4 grid grid-cols-3 gap-2">
	                              {studySubjectOptions.map((subject) => {
	                                const seconds = previewSubjectSeconds[subject] ?? 0
	                                const width = Math.max((seconds / previewMaxSubjectSeconds) * 100, seconds > 0 ? 12 : 4)
	                                const active = subject === row.current_subject

	                                return (
	                                  <div key={subject} className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
	                                    <div className={`text-xs font-black ${active ? 'text-blue-700' : 'text-slate-600'}`}>{subject}</div>
	                                    <div className="mt-2 h-1.5 rounded-full bg-white">
	                                      <div className={`h-full rounded-full ${active ? 'bg-blue-700' : 'bg-slate-400'}`} style={{ width: `${width}%` }} />
	                                    </div>
	                                    <div className="mt-2 text-[11px] font-semibold text-slate-500">{formatStudyDuration(seconds)}</div>
	                                  </div>
	                                )
	                              })}
	                            </div>
	                          </div>
	                        )}
	                      </div>
	                    )
	                  })
	                )}
              </div>
	            </div>
	          </div>
        </div>
      </SectionShell>
    )
  }

  function FundPage() {
    return (
      <SectionShell eyebrow="SERVICE" title="정시 파출소" description="정시 준비 중 막히는 지점을 점검하고 필요한 도움을 받을 수 있는 공간이야." wide>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {policeStationButtons.map(([title, description, path], index) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(path)}
              className="group flex min-h-48 flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="mt-5 text-xl font-black tracking-tight text-slate-900">{title}</div>
              <div className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</div>
              <div className="mt-5 text-sm font-black text-blue-700 transition group-hover:translate-x-1">출동하기</div>
            </button>
          ))}
        </div>
      </SectionShell>
    )
  }

  function GoodsPage() {
    const goodsItems = [
      ['청고정총 티셔츠', '21,000원', '/goods1.jpeg', false],
      ['청고정총 수능샤프', '5,000원', '/goods2.jpeg', false],
      ['청고정총 머그컵', '미정', '/goods3.png', true],
      ['청고정총 필통', '미정', '/goods4.png', true],
    ] as const

    return (
      <SectionShell eyebrow="SERVICE" title="굿즈샵" description="청고정총을 상징하는 굿즈." wide>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {goodsItems.map(([name, price, image, comingSoon]) => (
            <div key={name} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
              <div className="relative aspect-square bg-slate-50">
                <img
                  src={image}
                  alt={name}
                  className="h-full w-full object-cover"
                />
                {comingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 px-5 text-center">
                    <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-lg backdrop-blur-sm">
                      추후 판매 예정
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-sm font-semibold tracking-[0.16em] text-blue-700">GOODS</div>
                <div className="mt-3 text-xl font-black tracking-tight text-slate-900">{name}</div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className={`text-lg font-black ${comingSoon ? 'text-slate-400' : 'text-blue-700'}`}>{price}</div>
                  <div className={`rounded-full px-3 py-1 text-xs font-bold ${comingSoon ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                    {comingSoon ? '준비중' : '판매중'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>
    )
  }

  function PhotoBoothPage() {
    return (
      <SectionShell eyebrow="SERVICE" title="photo booth" description="활동 사진과 기념 콘텐츠를 확인하는 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">photo booth 콘텐츠를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  function CommunityPage() {
    return (
      <SectionShell eyebrow="COMMUNITY" title="커뮤니티" description="청고정총 커뮤니티 활동과 게시판 연결을 위한 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">커뮤니티 콘텐츠를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  function PressPage() {
    return (
      <SectionShell eyebrow="NOTICE" title="보도자료" description="청고정총 관련 보도자료와 외부 소개 자료를 모아보는 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">보도자료 콘텐츠를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  const topRightLabel = isLoggedIn ? currentUsername || currentName || currentUserEmail : '로그인'

  if (!sessionReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">불러오는 중...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
            <img
              src="/main-logo-symbol.png"
              alt=""
              className="h-11 w-11 rounded-xl object-contain"
            />
            <div>
              <div className="text-xl font-black tracking-tight text-slate-950">청고정총</div>
              <div className="text-sm text-slate-500">청주고 정시파이터 총연맹</div>
            </div>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <DropdownNav label="단체 소개" items={introMenu} id="about" />
            <DropdownNav label="서비스" items={serviceMenu} id="service" />
            <DropdownNav label="커뮤니티" items={communityMenu} id="community" />
            <DropdownNav label="공지사항" items={noticeMenu} id="notice" />
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <button onClick={() => navigate('/mypage')} className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm">👤</span>
                <span>{topRightLabel}</span>
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
                로그인
              </button>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden">
            메뉴
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <div className={`rounded-xl px-1 py-1 text-sm font-semibold ${isGroupActive(introMenu.map((item) => item[1])) ? 'text-blue-700' : 'text-slate-800'}`}>단체 소개</div>
              <div className="ml-3 flex flex-col gap-2">
                {introMenu.map(([label, path]) => (
                  <button key={path} onClick={() => navigate(path)} className="text-left text-sm text-slate-600 hover:text-blue-700">{label}</button>
                ))}
              </div>
              <div className={`mt-2 rounded-xl px-1 py-1 text-sm font-semibold ${isGroupActive(serviceMenu.map((item) => item[1])) ? 'text-blue-700' : 'text-slate-800'}`}>서비스</div>
              <div className="ml-3 flex flex-col gap-2">
                {serviceMenu.map(([label, path]) => (
                  <button key={path} onClick={() => navigate(path)} className="text-left text-sm text-slate-600 hover:text-blue-700">{label}</button>
                ))}
              </div>
              <div className={`mt-2 rounded-xl px-1 py-1 text-sm font-semibold ${isGroupActive(communityMenu.map((item) => item[1])) ? 'text-blue-700' : 'text-slate-800'}`}>커뮤니티</div>
              <div className="ml-3 flex flex-col gap-2">
                {communityMenu.map(([label, path]) => (
                  <button key={path} onClick={() => navigate(path)} className="text-left text-sm text-slate-600 hover:text-blue-700">{label}</button>
                ))}
              </div>
              <div className={`mt-2 rounded-xl px-1 py-1 text-sm font-semibold ${isGroupActive(noticeMenu.map((item) => item[1])) ? 'text-blue-700' : 'text-slate-800'}`}>공지사항</div>
              <div className="ml-3 flex flex-col gap-2">
                {noticeMenu.map(([label, path]) => (
                  <button key={path} onClick={() => navigate(path)} className="text-left text-sm text-slate-600 hover:text-blue-700">{label}</button>
                ))}
              </div>
              {isLoggedIn ? (
                <div className="mt-2 flex flex-col gap-2">
                  <button onClick={() => navigate('/mypage')} className="rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                    {topRightLabel}
                  </button>
                  <button onClick={handleLogout} className="rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                    로그아웃
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="mt-2 rounded-2xl bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white">
                  로그인
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-8 md:px-8 md:py-10">
        <Routes>
          <Route path="/" element={HomePage()} />
          <Route path="/about/chairman" element={ChairmanPage()} />
          <Route path="/about/organization" element={OrganizationPage()} />
          <Route path="/about/symbol" element={SymbolPage()} />
          <Route path="/about/location" element={LocationPage()} />
          <Route path="/login" element={loginPageElement} />
          <Route path="/signup" element={signupPageElement} />
          <Route path="/jeongsi-info" element={requireApproved(() => JeongsiPage())} />
          <Route path="/jeongsi-info/may-full-service" element={requireApproved(() => MayFullServicePage())} />
          <Route path="/service/study-with-jeongsi" element={requireApproved(() => StudyWithJeongsiPage())} />
          <Route path="/service/fund" element={requireApproved(() => FundPage())} />
          <Route path="/service/goods" element={requireApproved(() => GoodsPage())} />
          <Route path="/service/photo-booth" element={requireApproved(() => PhotoBoothPage())} />
          <Route path="/mypage" element={requireLogin(() => MyPage())} />
          <Route path="/admin/approvals" element={requireLogin(() => AdminApprovalsPage())} />
          <Route path="/admin/members" element={requireLogin(() => MemberManagementPage())} />
          <Route path="/notice" element={NoticePage()} />
          <Route path="/notice/community" element={requireApproved(() => CommunityPage())} />
          <Route path="/notice/press" element={PressPage()} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
