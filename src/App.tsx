import { createClient, type Session } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type ProfileRow = {
  username: string
  name: string
  grade: number | null
  class_no: number | null
  student_no: number | null
  is_admin: boolean
  is_approved: boolean
}

type ApprovalProfileRow = {
  id: string
  email: string | null
  username: string | null
  name: string | null
  grade: number | null
  class_no: number | null
  student_no: number | null
  is_admin: boolean | null
  is_approved: boolean | null
}

type StudyTimerRow = {
  user_id: string
  username: string | null
  name: string | null
  current_seconds: number | null
  is_running: boolean | null
  updated_at: string | null
}

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
  ['발전기금', '청고정총의 활동을 후원하는 안내 공간', '/service/fund'],
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
  ['발전기금', '/service/fund'],
  ['굿즈샵', '/service/goods'],
  ['photo booth', '/service/photo-booth'],
] as const

const communityMenu = [['커뮤니티', '/notice/community']] as const

const noticeMenu = [
  ['공지사항', '/notice'],
  ['보도자료', '/notice/press'],
] as const

const adminMenu = [['회원 승인 관리', '/admin/approvals']] as const

function formatRoleLabel(isAdmin: boolean, isApproved: boolean) {
  if (isAdmin) return '관리자'
  if (isApproved) return '승인된 일반 회원'
  return '승인 대기 회원'
}

function formatStudyDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

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
  const [currentUserId, setCurrentUserId] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [currentGrade, setCurrentGrade] = useState<number | null>(null)
  const [currentClassNo, setCurrentClassNo] = useState<number | null>(null)
  const [currentStudentNo, setCurrentStudentNo] = useState<number | null>(null)
  const [currentJoinedAt, setCurrentJoinedAt] = useState('')
  const [currentSubjectSelections, setCurrentSubjectSelections] = useState<SignupSubjectSelections>(initialSignupSubjectSelections)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileEditUsername, setProfileEditUsername] = useState('')
  const [profileEditPassword, setProfileEditPassword] = useState('')
  const [profileEditPasswordConfirm, setProfileEditPasswordConfirm] = useState('')
  const [profileEditSubjects, setProfileEditSubjects] = useState<SignupSubjectSelections>(initialSignupSubjectSelections)
  const [profileEditMessage, setProfileEditMessage] = useState('')
  const [profileEditSaving, setProfileEditSaving] = useState(false)

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
  const [approvalProfiles, setApprovalProfiles] = useState<ApprovalProfileRow[]>([])
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState('')
  const [approvalInitialized, setApprovalInitialized] = useState(false)
  const approvalsFetchedRef = useRef(false)

  const [studySeconds, setStudySeconds] = useState(0)
  const [studyRunning, setStudyRunning] = useState(false)
  const [studyStatusRows, setStudyStatusRows] = useState<StudyTimerRow[]>([])
  const [studyStatusLoading, setStudyStatusLoading] = useState(false)
  const [studyStatusReady, setStudyStatusReady] = useState(false)
  const [studyStatusMessage, setStudyStatusMessage] = useState('')
  const [studyTableEnabled, setStudyTableEnabled] = useState(true)
  const studyHydratedRef = useRef(false)

  function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error(`${label} timed out`)), ms)
      }),
    ])
  }

  async function loadProfile(userId: string, email: string) {
    setCurrentUserId(userId)

    if (!supabase) {
      setCurrentUserEmail(email)
      setCurrentUsername(email)
      setCurrentName('')
      setCurrentGrade(null)
      setCurrentClassNo(null)
      setCurrentStudentNo(null)
      setCurrentJoinedAt('')
      setCurrentSubjectSelections(initialSignupSubjectSelections)
      setIsAdmin(false)
      setIsApproved(false)
      return
    }

    try {
      const [{ data, error }, { data: userData, error: userError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, name, grade, class_no, student_no, is_admin, is_approved')
          .eq('id', userId)
          .maybeSingle<ProfileRow>(),
        supabase.auth.getUser(),
      ])

      const authUser = userData.user
      const metadata = ((authUser?.user_metadata ?? {}) as Record<string, string | undefined>)

      if (error || !data) {
        setCurrentUserEmail(email)
        setCurrentUsername(email)
        setCurrentName('')
        setCurrentGrade(null)
        setCurrentClassNo(null)
        setCurrentStudentNo(null)
        setCurrentJoinedAt(authUser?.created_at ?? '')
        setCurrentSubjectSelections({
          korean: metadata.korean_subject ?? initialSignupSubjectSelections.korean,
          math: metadata.math_subject ?? initialSignupSubjectSelections.math,
          english: metadata.english_choice ?? initialSignupSubjectSelections.english,
          inquiry1: metadata.inquiry1_subject ?? initialSignupSubjectSelections.inquiry1,
          inquiry2: metadata.inquiry2_subject ?? initialSignupSubjectSelections.inquiry2,
          secondForeign: metadata.second_foreign_subject ?? initialSignupSubjectSelections.secondForeign,
        })
        setIsAdmin(false)
        setIsApproved(false)
        return
      }

      setCurrentUserEmail(authUser?.email ?? email)
      setCurrentUsername(data.username)
      setCurrentName(data.name)
      setCurrentGrade(data.grade)
      setCurrentClassNo(data.class_no)
      setCurrentStudentNo(data.student_no)
      setCurrentJoinedAt(authUser?.created_at ?? '')
      setCurrentSubjectSelections({
        korean: metadata.korean_subject ?? initialSignupSubjectSelections.korean,
        math: metadata.math_subject ?? initialSignupSubjectSelections.math,
        english: metadata.english_choice ?? initialSignupSubjectSelections.english,
        inquiry1: metadata.inquiry1_subject ?? initialSignupSubjectSelections.inquiry1,
        inquiry2: metadata.inquiry2_subject ?? initialSignupSubjectSelections.inquiry2,
        secondForeign: metadata.second_foreign_subject ?? initialSignupSubjectSelections.secondForeign,
      })
      setIsAdmin(data.is_admin)
      setIsApproved(data.is_approved)

      if (userError) {
        console.error('loadProfile auth user error:', userError)
      }
    } catch (error) {
      console.error('loadProfile error:', error)
      setCurrentUserEmail(email)
      setCurrentUsername(email)
      setCurrentName('')
      setCurrentGrade(null)
      setCurrentClassNo(null)
      setCurrentStudentNo(null)
      setCurrentJoinedAt('')
      setCurrentSubjectSelections(initialSignupSubjectSelections)
      setIsAdmin(false)
      setIsApproved(false)
    }
  }

  useEffect(() => {
    let mounted = true
    let authResolved = false

    function resetLoggedOutState() {
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
      setIsAdmin(false)
      setIsApproved(false)
      setIsEditingProfile(false)
      setProfileEditUsername('')
      setProfileEditPassword('')
      setProfileEditPasswordConfirm('')
      setProfileEditSubjects(initialSignupSubjectSelections)
      setProfileEditMessage('')
      setStudyRunning(false)
      setStudySeconds(0)
      setStudyStatusRows([])
      setStudyStatusReady(false)
      setStudyStatusMessage('')
    }

    const forceReadyTimer = window.setTimeout(() => {
      if (!mounted || authResolved) return
      console.warn('auth bootstrap fallback triggered')
      resetLoggedOutState()
      setSessionReady(true)
    }, 5000)

    function finishAuthBootstrap() {
      authResolved = true
      window.clearTimeout(forceReadyTimer)
      if (mounted) setSessionReady(true)
    }

    async function applySession(session: Session | null) {
      try {
        if (!mounted) return

        if (session?.user) {
          setIsLoggedIn(true)
          await withTimeout(loadProfile(session.user.id, session.user.email ?? ''), 4000, 'loadProfile')
        } else {
          resetLoggedOutState()
        }
      } catch (error) {
        console.error('applySession error:', error)
        if (mounted) {
          resetLoggedOutState()
        }
      } finally {
        finishAuthBootstrap()
      }
    }

    async function initAuth() {
      try {
        const sb = supabase
        if (!sb) {
          finishAuthBootstrap()
          return
        }

        const { data } = await withTimeout(sb.auth.getSession(), 4000, 'getSession')
        await applySession(data.session)
      } catch (error) {
        console.error('initAuth error:', error)
        if (mounted) {
          resetLoggedOutState()
        }
        finishAuthBootstrap()
      }
    }

    initAuth()

    const sb = supabase
    if (!sb) {
      return () => {
        mounted = false
        window.clearTimeout(forceReadyTimer)
      }
    }

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session)
    })

    return () => {
      mounted = false
      window.clearTimeout(forceReadyTimer)
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


  useEffect(() => {
    if (!studyRunning) return

    const interval = window.setInterval(() => {
      setStudySeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [studyRunning])

  useEffect(() => {
    if (!isLoggedIn || !currentUserId) {
      studyHydratedRef.current = false
      setStudyRunning(false)
      setStudySeconds(0)
      setStudyStatusRows([])
      setStudyStatusReady(false)
      return
    }

    if (!sessionReady) return

    studyHydratedRef.current = false
    void fetchStudyStatusRows()

    const poll = window.setInterval(() => {
      void fetchStudyStatusRows()
    }, 5000)

    return () => {
      window.clearInterval(poll)
    }
  }, [isLoggedIn, currentUserId, sessionReady])

  useEffect(() => {
    if (!studyRunning || !isLoggedIn || !currentUserId || !studyTableEnabled) return
    if (studySeconds === 0 || studySeconds % 5 !== 0) return

    void syncStudyTimerStatus(studySeconds, true)
  }, [studySeconds, studyRunning, isLoggedIn, currentUserId, studyTableEnabled])

  useEffect(() => {
    if (!isLoggedIn || !currentUserId || !studyTableEnabled) return
    if (studyRunning) return

    void syncStudyTimerStatus(studySeconds, false)
  }, [studyRunning, isLoggedIn, currentUserId, studySeconds, studyTableEnabled])

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

    const signupEmailValue = signupEmail.trim()
    const signupUsernameValue = signupUsername.trim()
    const signupNameValue = signupName.trim()
    const signupGradeValue = Number(signupGrade)
    const signupClassNoValue = Number(signupClassNo)
    const signupStudentNoValue = Number(signupStudentNo)

    const { data, error } = await supabase.auth.signUp({
      email: signupEmailValue,
      password: signupPassword,
      options: {
        data: {
          username: signupUsernameValue,
          name: signupNameValue,
          grade: signupGradeValue,
          class_no: signupClassNoValue,
          student_no: signupStudentNoValue,
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

    const signedUpUser = data.user

    if (signedUpUser) {
      const { error: profileInsertError } = await supabase.from('profiles').upsert({
        id: signedUpUser.id,
        email: signupEmailValue,
        username: signupUsernameValue,
        name: signupNameValue,
        grade: signupGradeValue,
        class_no: signupClassNoValue,
        student_no: signupStudentNoValue,
        is_admin: false,
        is_approved: false,
      })

      if (profileInsertError) {
        setSignupMessage('회원가입은 되었지만 승인 대기 등록에 실패했습니다: ' + profileInsertError.message)
        return
      }
    }

    setSignupMessage('회원가입 신청이 완료되었습니다. 이제 관리자 승인 목록에서 바로 확인할 수 있습니다.')
    setSignupEmail('')
    setSignupPassword('')
    setSignupPasswordConfirm('')
    setSignupUsername('')
    setSignupName('')
    setSignupStudentNo('')
    setSignupSubjectSelections(initialSignupSubjectSelections)
    navigate('/')
  }

  async function ensureProfileExists() {
    if (!supabase) return true

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return false

      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingError) {
        setLoginMessage('프로필 확인 실패: ' + existingError.message)
        return false
      }

      if (existing) return true

      const meta = user.user_metadata ?? {}

      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? loginEmail.trim(),
          username: String(meta.username ?? currentUsername ?? 'user'),
          name: String(meta.name ?? currentName ?? '이름없음'),
          grade: meta.grade ? Number(meta.grade) : null,
          class_no: meta.class_no ? Number(meta.class_no) : null,
          student_no: meta.student_no ? Number(meta.student_no) : null,
          is_admin: false,
          is_approved: false,
        },
        { onConflict: 'id' },
      )

      if (error) {
        setLoginMessage('프로필 생성 실패: ' + error.message)
        return false
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      setLoginMessage('프로필 확인 실패: ' + message)
      return false
    }
  }

  async function handleSupabaseLogin() {
    setLoginMessage('')

    if (!supabase) {
      setLoginMessage('Supabase 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인해주세요.')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    if (error) {
      setLoginMessage('로그인 실패: ' + error.message)
      return
    }

    const ok = await ensureProfileExists()
    if (!ok) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await loadProfile(user.id, user.email ?? loginEmail.trim())
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', user?.id ?? '')
      .maybeSingle()

    if (profileData?.is_approved) {
      setLoginMessage('로그인 성공')
    } else {
      setLoginMessage('로그인 성공 · 현재 승인 대기 중입니다.')
    }

    navigate('/')
  }

  function openProfileEdit() {
    setProfileEditUsername(currentUsername || '')
    setProfileEditPassword('')
    setProfileEditPasswordConfirm('')
    setProfileEditSubjects(currentSubjectSelections)
    setProfileEditMessage('')
    setIsEditingProfile(true)
  }

  async function handleProfileSave() {
    if (!supabase) {
      setProfileEditMessage('Supabase 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인해주세요.')
      return
    }
    if (!currentUserId) {
      setProfileEditMessage('현재 사용자 정보를 불러오지 못했습니다.')
      return
    }

    const nextUsername = profileEditUsername.trim()
    if (!nextUsername) {
      setProfileEditMessage('아이디를 입력해주세요.')
      return
    }
    if (
      profileEditSubjects.inquiry1 !== '응시하지 않음' &&
      profileEditSubjects.inquiry2 !== '응시하지 않음' &&
      profileEditSubjects.inquiry1 === profileEditSubjects.inquiry2
    ) {
      setProfileEditMessage('탐구 1과 탐구 2의 선택과목이 같습니다. 서로 다르게 선택해야 합니다.')
      return
    }
    if (profileEditPassword && (profileEditPassword.length < 8 || profileEditPassword.length > 20)) {
      setProfileEditMessage('비밀번호는 8자 이상 20자 이하여야 합니다.')
      return
    }
    if (profileEditPassword !== profileEditPasswordConfirm) {
      setProfileEditMessage('비밀번호가 서로 일치하지 않습니다.')
      return
    }

    setProfileEditSaving(true)
    setProfileEditMessage('')

    try {
      const metadataPayload = {
        username: nextUsername,
        name: currentName,
        grade: currentGrade,
        class_no: currentClassNo,
        student_no: currentStudentNo,
        korean_subject: profileEditSubjects.korean,
        math_subject: profileEditSubjects.math,
        english_choice: profileEditSubjects.english,
        inquiry1_subject: profileEditSubjects.inquiry1,
        inquiry2_subject: profileEditSubjects.inquiry2,
        second_foreign_subject: profileEditSubjects.secondForeign,
      }

      const updatePayload: {
        password?: string
        data?: typeof metadataPayload
      } = {
        data: metadataPayload,
      }

      if (profileEditPassword) {
        updatePayload.password = profileEditPassword
      }

      const { error: authUpdateError } = await supabase.auth.updateUser(updatePayload)
      if (authUpdateError) {
        setProfileEditMessage('프로필 수정 실패: ' + authUpdateError.message)
        return
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ username: nextUsername })
        .eq('id', currentUserId)

      if (profileUpdateError) {
        setProfileEditMessage('프로필 수정 실패: ' + profileUpdateError.message)
        return
      }

      await loadProfile(currentUserId, currentUserEmail)
      setProfileEditPassword('')
      setProfileEditPasswordConfirm('')
      setIsEditingProfile(false)
      setProfileEditMessage('프로필이 수정되었습니다.')
    } catch (error) {
      setProfileEditMessage('프로필 수정 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    } finally {
      setProfileEditSaving(false)
    }
  }


  async function syncStudyTimerStatus(nextSeconds: number, nextRunning: boolean) {
    if (!supabase || !currentUserId) return false

    const { error } = await supabase.from('study_timer_status').upsert(
      {
        user_id: currentUserId,
        username: currentUsername || currentUserEmail || 'user',
        name: currentName || null,
        current_seconds: nextSeconds,
        is_running: nextRunning,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('syncStudyTimerStatus error:', error)
      if (error.message.toLowerCase().includes('study_timer_status')) {
        setStudyTableEnabled(false)
        setStudyStatusMessage('study_timer_status 테이블이 아직 준비되지 않았습니다. SQL로 테이블을 먼저 만들어줘야 해.')
      } else {
        setStudyStatusMessage('타이머 상태 동기화에 실패했습니다: ' + error.message)
      }
      return false
    }

    setStudyTableEnabled(true)
    return true
  }

  async function fetchStudyStatusRows() {
    if (!supabase) {
      setStudyTableEnabled(false)
      setStudyStatusReady(true)
      return
    }

    setStudyStatusLoading(true)
    try {
      const { data, error } = await supabase
        .from('study_timer_status')
        .select('user_id, username, name, current_seconds, is_running, updated_at')
        .order('is_running', { ascending: false })
        .order('current_seconds', { ascending: false })

      if (error) {
        throw error
      }

      const rows = (data ?? []) as StudyTimerRow[]
      setStudyStatusRows(rows)
      setStudyStatusMessage('')
      setStudyTableEnabled(true)
      setStudyStatusReady(true)

      if (!studyHydratedRef.current && currentUserId) {
        const myRow = rows.find((row) => row.user_id === currentUserId)
        if (myRow) {
          const syncedSeconds = Math.max(0, Number(myRow.current_seconds ?? 0))
          const lastUpdated = myRow.updated_at ? new Date(myRow.updated_at).getTime() : Date.now()
          const driftSeconds = myRow.is_running ? Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000)) : 0
          setStudySeconds(syncedSeconds + driftSeconds)
          setStudyRunning(Boolean(myRow.is_running))
        }
        studyHydratedRef.current = true
      }
    } catch (error) {
      console.error('fetchStudyStatusRows error:', error)
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      if (message.toLowerCase().includes('study_timer_status')) {
        setStudyTableEnabled(false)
        setStudyStatusMessage('study_timer_status 테이블이 아직 준비되지 않았습니다. SQL로 테이블을 먼저 만들어줘야 해.')
      } else {
        setStudyStatusMessage('다른 사람 타이머를 불러오지 못했습니다: ' + message)
      }
      setStudyStatusReady(true)
    } finally {
      setStudyStatusLoading(false)
    }
  }

  async function handleStartStudyTimer() {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    setStudyStatusMessage('')
    setStudyRunning(true)
    await syncStudyTimerStatus(studySeconds, true)
    await fetchStudyStatusRows()
  }

  async function handlePauseStudyTimer() {
    setStudyRunning(false)
    await syncStudyTimerStatus(studySeconds, false)
    await fetchStudyStatusRows()
  }

  async function handleResetStudyTimer() {
    setStudyRunning(false)
    setStudySeconds(0)
    await syncStudyTimerStatus(0, false)
    await fetchStudyStatusRows()
  }

  async function handleLogout() {
    if (supabase && currentUserId) {
      try {
        await syncStudyTimerStatus(studySeconds, false)
      } catch (error) {
        console.error('logout study sync error:', error)
      }
    }

    setStudyRunning(false)
    setMobileMenuOpen(false)
    setOpenDropdown(null)
    setSessionReady(true)
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
    setIsAdmin(false)
    setIsApproved(false)
    setIsEditingProfile(false)
    setProfileEditUsername('')
    setProfileEditPassword('')
    setProfileEditPasswordConfirm('')
    setProfileEditSubjects(initialSignupSubjectSelections)
    setProfileEditMessage('')

    if (!supabase) {
      navigate('/')
      return
    }

    try {
      await withTimeout(supabase.auth.signOut(), 3000, 'signOut')
    } catch (error) {
      console.error('logout error:', error)
    } finally {
      navigate('/')
    }
  }

  async function fetchPendingApprovals(options?: { silent?: boolean }) {
    if (!supabase) {
      setApprovalProfiles([])
      setApprovalMessage('Supabase가 연결되지 않아 승인 목록을 불러올 수 없습니다.')
      setApprovalInitialized(true)
      return
    }

    if (!currentUserId) {
      setApprovalInitialized(true)
      return
    }

    if (!options?.silent) {
      setApprovalLoading(true)
    }
    setApprovalMessage('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, name, grade, class_no, student_no, is_admin, is_approved')
        .eq('is_approved', false)
        .neq('id', currentUserId)
        .order('grade', { ascending: true })
        .order('class_no', { ascending: true })
        .order('student_no', { ascending: true })

      if (error) {
        setApprovalMessage('승인 대기 목록을 불러오지 못했습니다: ' + error.message)
        return
      }

      setApprovalProfiles((data ?? []) as ApprovalProfileRow[])
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      setApprovalMessage('승인 대기 목록을 불러오지 못했습니다: ' + message)
    } finally {
      setApprovalLoading(false)
      setApprovalInitialized(true)
    }
  }

  async function handleRefreshApprovals() {
    approvalsFetchedRef.current = false
    setApprovalInitialized(false)
    await fetchPendingApprovals()
  }

  async function approveMember(profileId: string, label: string) {
    if (!supabase) {
      setApprovalMessage('Supabase가 연결되지 않아 승인할 수 없습니다.')
      return
    }

    setApprovalMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', profileId)

    if (error) {
      setApprovalMessage('승인 처리에 실패했습니다: ' + error.message)
      return
    }

    setApprovalProfiles((prev) => prev.filter((profile) => profile.id !== profileId))
    setApprovalMessage(`${label} 회원을 승인했습니다.`)
  }

  async function rejectMember(profileId: string, label: string) {
    if (!supabase) {
      setApprovalMessage('Supabase가 연결되지 않아 거절할 수 없습니다.')
      return
    }

    setApprovalMessage('')

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (error) {
      setApprovalMessage('거절 처리에 실패했습니다: ' + error.message)
      return
    }

    setApprovalProfiles((prev) => prev.filter((profile) => profile.id !== profileId))
    setApprovalMessage(`${label} 회원 신청을 거절했습니다.`)
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
    return paths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
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

  function SupabaseWarning() {
    return null
  }

  function HomePage() {
    return (
      <div className="space-y-8">
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative px-8 py-14 md:px-14 md:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_42%)]" />
              <div className="relative max-w-3xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white">정</span>
                  CHEONGGO JEONGCHONG
                </div>
                <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-7xl">
                  청주고정시파이터총연맹
                </h1>
                <div className="mt-5 text-2xl font-black tracking-[0.32em] text-blue-700">청.고.정.총</div>
                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
                  정시를 향해 함께 공부하고, 서로를 자극하며, 끝까지 흐름을 지켜내는 청주고 학습 공동체.
                  기록보다 실력, 포장보다 축적, 흔들림보다 지속을 선택하는 사람들의 공간.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => navigate('/jeongsi-info')}
                    className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                  >
                    All About 정시 보기
                  </button>
                  {!isLoggedIn && (
                    <button
                      onClick={() => navigate('/login')}
                      className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      로그인하기
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="grid gap-4">
                {[
                  ['LIVE STATUS', '23명', '현재 study with 정시에서 공부 중인 인원'],
                  ['TOP STUDY', '이승재', '누적 공부 시간 이번 주 랭킹 1위'],
                  ["TODAY'S DRIVE", '418시간', '오늘 회원 전체 누적 공부 시간'],
                ].map(([eyebrow, value, desc], index) => (
                  <div
                    key={eyebrow}
                    className={`rounded-[1.75rem] border p-6 shadow-sm ${index === 1 ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                  >
                    <div className={`text-sm font-semibold tracking-[0.22em] ${index === 1 ? 'text-blue-100' : 'text-blue-700'}`}>{eyebrow}</div>
                    <div className="mt-4 text-4xl font-black tracking-tight">{value}</div>
                    <div className={`mt-3 text-sm leading-relaxed ${index === 1 ? 'text-blue-100' : 'text-slate-600'}`}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
          {loginMessage && <div className={`text-sm font-medium ${loginMessage.includes('성공') || loginMessage.includes('승인 대기') ? 'text-blue-700' : 'text-red-500'}`}>{loginMessage}</div>}
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
            className="group block w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">FULL SERVICE</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">5월 학력평가 풀서비스</h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
                  등급컷, 회원별 성적 순위표, 성적 입력 기능을 한 번에 확인할 수 있는 5월 학력평가 전용 서비스 페이지.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-blue-800">
                들어가기
              </div>
            </div>
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

  function AdminApprovalsPage() {
    useEffect(() => {
      if (!sessionReady || !isAdmin || !currentUserId) return
      if (approvalsFetchedRef.current) return

      approvalsFetchedRef.current = true
      void fetchPendingApprovals()
    }, [sessionReady, isAdmin, currentUserId])

    if (!sessionReady) {
      return (
        <SectionShell
          eyebrow="ADMIN"
          title="회원 승인 관리"
          description="관리자 인증 상태를 확인하는 중이야. 잠시만 기다려줘."
          wide
        >
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">권한을 확인하고 있어.</div>
        </SectionShell>
      )
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" replace />
    }

    if (!isAdmin) {
      return <Navigate to="/" replace />
    }

    return (
      <div className="space-y-8">
        <SectionShell
          eyebrow="ADMIN"
          title="회원 승인 관리"
          description="관리자만 접근할 수 있는 가입 신청 관리 페이지야. 대기 중인 회원을 검토하고 바로 승인하거나 거절할 수 있어."
          wide
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">PENDING APPROVALS</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">승인 대기 회원 {approvalProfiles.length}명</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">승인 시 해당 회원은 즉시 사이트 주요 기능을 사용할 수 있어. 거절 시 현재 구현에서는 프로필 행이 삭제돼.</p>
                {approvalLoading && approvalProfiles.length > 0 && (
                  <div className="mt-3 text-xs font-medium text-slate-500">목록을 새로 확인하고 있어.</div>
                )}
              </div>
              <button
                onClick={() => void handleRefreshApprovals()}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
              >
                새로고침
              </button>
            </div>

            {approvalMessage && (
              <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${approvalMessage.includes('실패') || approvalMessage.includes('연결') ? 'border-red-200 bg-red-50 text-red-600' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                {approvalMessage}
              </div>
            )}

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-4 text-sm font-bold md:px-6">이름</th>
                      <th className="px-5 py-4 text-sm font-bold md:px-6">아이디</th>
                      <th className="px-5 py-4 text-sm font-bold md:px-6">학번 정보</th>
                      <th className="px-5 py-4 text-sm font-bold md:px-6">이메일</th>
                      <th className="px-5 py-4 text-sm font-bold md:px-6">권한</th>
                      <th className="px-5 py-4 text-sm font-bold md:px-6">처리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-slate-800">
                    {!approvalInitialized && approvalProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">승인 대기 목록을 준비하는 중이야.</td>
                      </tr>
                    ) : approvalProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">현재 승인 대기 중인 회원이 없어.</td>
                      </tr>
                    ) : (
                      approvalProfiles.map((profile, index) => {
                        const label = profile.name || profile.username || profile.email || '이 회원'
                        const gradeLabel = profile.grade && profile.class_no && profile.student_no
                          ? `${profile.grade}학년 ${profile.class_no}반 ${profile.student_no}번`
                          : '학번 정보 없음'

                        return (
                          <tr key={profile.id} className={index !== approvalProfiles.length - 1 ? 'border-b border-slate-200' : ''}>
                            <td className="px-5 py-5 md:px-6">
                              <div className="font-bold text-slate-900">{profile.name || '-'}</div>
                            </td>
                            <td className="px-5 py-5 md:px-6">{profile.username || '-'}</td>
                            <td className="px-5 py-5 md:px-6">{gradeLabel}</td>
                            <td className="px-5 py-5 md:px-6 text-sm text-slate-600">{profile.email || '-'}</td>
                            <td className="px-5 py-5 md:px-6">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${profile.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {profile.is_admin ? '관리자 계정' : '일반 회원'}
                              </span>
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => void approveMember(profile.id, label)}
                                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => void rejectMember(profile.id, label)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                                >
                                  거절
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SectionShell>
      </div>
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
              <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-sm">
                <div className="bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_52%,#1d4ed8_100%)] px-6 py-7 text-white md:px-8 md:py-8">
                  <div className="text-sm font-semibold tracking-[0.18em] text-blue-100">PROFILE</div>
                  <div className="mt-4 text-4xl font-black tracking-tight md:text-5xl">장주헌</div>
                  <div className="mt-3 text-lg font-medium text-blue-100">청주고정시파이터총연합 1대 회장</div>
                </div>
                <div className="px-6 py-6 md:px-8">
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
      <SectionShell eyebrow="ABOUT" title="찾아 오시는 길" description="청고정총 관련 공간이나 오프라인 안내를 연결하는 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">지도와 위치 안내 콘텐츠를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  function StudyWithJeongsiPage() {
    const myStudyRank = studyStatusRows.findIndex((row) => row.user_id === currentUserId) + 1

    return (
      <SectionShell
        eyebrow="SERVICE"
        title="study with 정시"
        description="열품타처럼 집중 시간을 함께 쌓아 보는 테스트 버전이야. 타이머를 시작하면 내 공부 시간이 올라가고, 아래에서 다른 사람의 타이머도 같이 볼 수 있어."
        wide
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">MY TIMER</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{formatStudyDuration(studySeconds)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {isLoggedIn
                    ? `${currentUsername || currentName || currentUserEmail} 계정으로 공부 시간을 기록하고 있어.`
                    : '로그인해야 내 타이머를 서버에 기록하고 다른 사람에게도 보이게 할 수 있어.'}
                </p>
              </div>
              <div className={`rounded-full px-4 py-2 text-sm font-semibold ${studyRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {studyRunning ? '공부 중' : '대기 중'}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => void handleStartStudyTimer()}
                className="rounded-2xl bg-blue-700 px-5 py-4 text-base font-semibold text-white transition hover:bg-blue-800"
              >
                타이머 시작
              </button>
              <button
                type="button"
                onClick={() => void handlePauseStudyTimer()}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                일시정지
              </button>
              <button
                type="button"
                onClick={() => void handleResetStudyTimer()}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
              >
                초기화
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">TODAY</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{formatStudyDuration(studySeconds)}</div>
                <div className="mt-2 text-sm text-slate-500">현재 기기에 기록 중인 누적 공부 시간</div>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">MY RANK</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{myStudyRank > 0 ? `${myStudyRank}위` : '-'}</div>
                <div className="mt-2 text-sm text-slate-500">현재 보이는 스터디 타이머 기준 순위</div>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">LIVE USERS</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{studyStatusRows.filter((row) => row.is_running).length}명</div>
                <div className="mt-2 text-sm text-slate-500">지금 study with 정시 타이머를 돌리는 사람 수</div>
              </div>
            </div>

            {studyStatusMessage ? <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{studyStatusMessage}</div> : null}
            {!studyTableEnabled ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-700">
                테스트하려면 Supabase에 <span className="font-semibold">study_timer_status</span> 테이블을 먼저 만들어야 해.
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">LIVE BOARD</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">다른 사람 타이머</h2>
              </div>
              <button
                type="button"
                onClick={() => void fetchStudyStatusRows()}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                새로고침
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {!studyStatusReady && studyStatusLoading ? (
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">타이머 목록을 불러오는 중이야.</div>
              ) : studyStatusRows.length === 0 ? (
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">아직 표시할 타이머가 없어. 먼저 한 명이 타이머를 시작하면 여기서 바로 볼 수 있어.</div>
              ) : (
                studyStatusRows.map((row, index) => {
                  const displayName = row.name || row.username || '익명 사용자'
                  const isMe = row.user_id === currentUserId
                  return (
                    <div key={row.user_id} className={`rounded-[1.3rem] border px-4 py-4 ${isMe ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">#{index + 1}</div>
                          <div className="mt-1 text-lg font-black tracking-tight text-slate-900">{displayName}{isMe ? ' · 나' : ''}</div>
                          <div className="mt-1 text-sm text-slate-500">{row.is_running ? '지금 공부 중' : '현재 일시정지'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black tracking-tight text-slate-900">{formatStudyDuration(Number(row.current_seconds ?? 0))}</div>
                          <div className="mt-1 text-xs text-slate-500">{row.updated_at ? new Date(row.updated_at).toLocaleTimeString('ko-KR') : '-'}</div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </SectionShell>
    )
  }

  function FundPage() {
    return (
      <SectionShell eyebrow="SERVICE" title="발전기금" description="청고정총 활동을 후원하고 지원하는 안내 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">발전기금 안내를 여기에 연결할 수 있어.</div>
      </SectionShell>
    )
  }

  function GoodsPage() {
    return (
      <SectionShell eyebrow="SERVICE" title="굿즈샵" description="청고정총 굿즈와 상징 아이템을 확인하는 페이지야.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">굿즈샵 콘텐츠를 여기에 연결할 수 있어.</div>
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

  function MyPage() {
    if (!sessionReady) {
      return (
        <SectionShell eyebrow="PROFILE" title="내 정보" description="로그인 상태를 확인하는 중이야. 잠시만 기다려줘.">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">계정 정보를 확인하고 있어.</div>
        </SectionShell>
      )
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" replace />
    }

    const roleLabel = formatRoleLabel(isAdmin, isApproved)
    const classInfo =
      currentGrade && currentClassNo && currentStudentNo
        ? `${currentGrade}학년 ${currentClassNo}반 ${currentStudentNo}번`
        : '학번 정보 없음'
    const joinedAtLabel = currentJoinedAt
      ? new Date(currentJoinedAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '가입일 정보 없음'

    const subjectRows = [
      ['국어', currentSubjectSelections.korean],
      ['수학', currentSubjectSelections.math],
      ['영어', currentSubjectSelections.english],
      ['탐구 1', currentSubjectSelections.inquiry1],
      ['탐구 2', currentSubjectSelections.inquiry2],
      ['제2외국어/한문', currentSubjectSelections.secondForeign],
    ] as const

    return (
      <SectionShell
        eyebrow="PROFILE"
        title={currentName || currentUsername || currentUserEmail || '내 정보'}
        description="현재 로그인한 계정의 기본 정보와 선택과목 설정을 확인하고 수정할 수 있는 공간이야."
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">PROFILE</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{currentName || currentUsername || '사용자'}</h2>
                <p className="mt-2 text-sm text-slate-500">{currentUserEmail || '이메일 정보 없음'}</p>
              </div>
              <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${isAdmin ? 'bg-amber-100 text-amber-700' : isApproved ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {roleLabel}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">아이디</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{currentUsername || '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">현재 등급</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{roleLabel}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">학번 정보</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{classInfo}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">가입일</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{joinedAtLabel}</div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">선택과목 설정</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {subjectRows.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold tracking-[0.16em] text-slate-500">{label}</div>
                    <div className="mt-2 text-base font-bold text-slate-900">{value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">EDIT</div>
                {!isEditingProfile ? (
                  <button
                    onClick={openProfileEdit}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    프로필 수정
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingProfile(false)
                      setProfileEditMessage('')
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                  >
                    닫기
                  </button>
                )}
              </div>

              {profileEditMessage && (
                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${profileEditMessage.includes('수정되었습니다') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                  {profileEditMessage}
                </div>
              )}

              {isEditingProfile ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">아이디</label>
                    <input
                      value={profileEditUsername}
                      onChange={(event) => setProfileEditUsername(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="아이디"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">새 비밀번호</label>
                    <input
                      type="password"
                      value={profileEditPassword}
                      onChange={(event) => setProfileEditPassword(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="변경하지 않으려면 비워두기"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={profileEditPasswordConfirm}
                      onChange={(event) => setProfileEditPasswordConfirm(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="비밀번호 재입력"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">국어 선택과목</label>
                      <select value={profileEditSubjects.korean} onChange={(event) => setProfileEditSubjects((prev) => ({ ...prev, korean: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {koreanOptions.map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">수학 선택과목</label>
                      <select value={profileEditSubjects.math} onChange={(event) => setProfileEditSubjects((prev) => ({ ...prev, math: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {mathOptions.map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">영어 응시 여부</label>
                      <select value={profileEditSubjects.english} onChange={(event) => setProfileEditSubjects((prev) => ({ ...prev, english: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {['응시함', '응시하지 않음'].map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">탐구 1</label>
                      <select value={profileEditSubjects.inquiry1} onChange={(event) => setProfileEditSubjects((prev) => ({ ...prev, inquiry1: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {['응시하지 않음', ...inquiryOptions].map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">탐구 2</label>
                      <select value={profileEditSubjects.inquiry2} onChange={(event) => setProfileEditSubjects((prev) => ({ ...prev, inquiry2: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {['응시하지 않음', ...inquiryOptions].map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">제2외국어/한문</label>
                      <select value={profileEditSubjects.secondForeign} onChange={(event) => setProfileEditSubjects((prev) => ({ ...prev, secondForeign: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {['응시하지 않음', '독일어Ⅰ', '프랑스어Ⅰ', '스페인어Ⅰ', '중국어Ⅰ', '일본어Ⅰ', '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ', '한문Ⅰ'].map((subject) => <option key={subject}>{subject}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleProfileSave()}
                    disabled={profileEditSaving}
                    className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {profileEditSaving ? '수정 중...' : '프로필 저장'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 text-sm leading-relaxed text-slate-600">
                  아이디, 비밀번호, 선택과목 설정을 여기서 수정할 수 있어.
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">ACCOUNT</div>
              <button
                onClick={() => void handleLogout()}
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                로그아웃
              </button>
            </div>

            {isAdmin && (
              <div className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6">
                <div className="text-sm font-semibold tracking-[0.18em] text-amber-700">ADMIN</div>
                <p className="mt-3 text-sm leading-relaxed text-amber-900">
                  관리자 계정으로 로그인되어 있어. 회원 승인 관리 페이지로 바로 이동할 수 있어.
                </p>
                <button
                  onClick={() => navigate('/admin/approvals')}
                  className="mt-6 w-full rounded-2xl border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  회원 승인 관리로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </SectionShell>
    )
  }

  const topRightLabel = isLoggedIn ? currentUsername || currentName || currentUserEmail : '로그인'
  const myPageButtonLabel = isLoggedIn ? topRightLabel : '로그인'

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button onClick={() => navigate('/')} className="text-left">
            <div className="text-xl font-black tracking-tight text-slate-950">청고정총</div>
            <div className="text-sm text-slate-500">청주고 정시파이터 총연맹</div>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <DropdownNav label="단체 소개" items={introMenu} id="about" />
            <DropdownNav label="서비스" items={serviceMenu} id="service" />
            <DropdownNav label="커뮤니티" items={communityMenu} id="community" />
            <DropdownNav label="공지사항" items={noticeMenu} id="notice" />
            {isAdmin && <DropdownNav label="관리자" items={adminMenu} id="admin" />}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <button onClick={() => navigate('/mypage')} className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm">👤</span>
                <span>{myPageButtonLabel}</span>
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
              {isAdmin && (
                <>
                  <div className={`mt-2 rounded-xl px-1 py-1 text-sm font-semibold ${isGroupActive(adminMenu.map((item) => item[1])) ? 'text-blue-700' : 'text-slate-800'}`}>관리자</div>
                  <div className="ml-3 flex flex-col gap-2">
                    {adminMenu.map(([label, path]) => (
                      <button key={path} onClick={() => navigate(path)} className="text-left text-sm text-slate-600 hover:text-blue-700">{label}</button>
                    ))}
                  </div>
                </>
              )}
              {isLoggedIn ? (
                <button onClick={() => navigate('/mypage')} className="mt-2 rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                  {myPageButtonLabel}
                </button>
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
          <Route path="/" element={<HomePage />} />
          <Route path="/about/chairman" element={<ChairmanPage />} />
          <Route path="/about/organization" element={<OrganizationPage />} />
          <Route path="/about/symbol" element={<SymbolPage />} />
          <Route path="/about/location" element={<LocationPage />} />
          <Route path="/login" element={loginPageElement} />
          <Route path="/signup" element={signupPageElement} />
          <Route path="/jeongsi-info" element={<JeongsiPage />} />
          <Route path="/jeongsi-info/may-full-service" element={<MayFullServicePage />} />
          <Route path="/service/study-with-jeongsi" element={<StudyWithJeongsiPage />} />
          <Route path="/service/fund" element={<FundPage />} />
          <Route path="/service/goods" element={<GoodsPage />} />
          <Route path="/service/photo-booth" element={<PhotoBoothPage />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/community" element={<CommunityPage />} />
          <Route path="/notice/press" element={<PressPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
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
