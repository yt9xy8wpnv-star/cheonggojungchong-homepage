import { createClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

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

type Page = 'home' | 'login' | 'signup' | 'jeongsi-info' | 'may-full-service' | 'notice'

type ProfileRow = {
  username: string
  name: string
  is_admin: boolean
  is_approved: boolean
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [sessionReady, setSessionReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

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

  const [scoreForm, setScoreForm] = useState({
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
  })
  const [scoreMessage, setScoreMessage] = useState('')

  async function loadProfile(userId: string, email: string) {
    if (!supabase) {
      setCurrentUserEmail(email)
      setCurrentUsername(email)
      setCurrentName('')
      setIsAdmin(false)
      setIsApproved(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username, name, is_admin, is_approved')
      .eq('id', userId)
      .single<ProfileRow>()

    if (error || !data) {
      setCurrentUserEmail(email)
      setCurrentUsername(email)
      setCurrentName('')
      setIsAdmin(false)
      setIsApproved(false)
      return
    }

    setCurrentUserEmail(email)
    setCurrentUsername(data.username)
    setCurrentName(data.name)
    setIsAdmin(data.is_admin)
    setIsApproved(data.is_approved)
  }

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      if (!supabase) {
        if (mounted) setSessionReady(true)
        return
      }

      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!mounted) return

      if (session?.user) {
        setIsLoggedIn(true)
        await loadProfile(session.user.id, session.user.email ?? '')
      } else {
        setIsLoggedIn(false)
        setCurrentUserEmail('')
        setCurrentUsername('')
        setCurrentName('')
        setIsAdmin(false)
        setIsApproved(false)
      }

      setSessionReady(true)
    }

    initAuth()

    if (!supabase) {
      return () => {
        mounted = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setIsLoggedIn(true)
        await loadProfile(session.user.id, session.user.email ?? '')
      } else {
        setIsLoggedIn(false)
        setCurrentUserEmail('')
        setCurrentUsername('')
        setCurrentName('')
        setIsAdmin(false)
        setIsApproved(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
    })

    if (error) {
      setSignupMessage(error.message)
      return
    }

    if (!data.user) {
      setSignupMessage('회원가입에 실패했습니다.')
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: signupEmail.trim(),
      username: signupUsername.trim(),
      name: signupName.trim(),
      grade: Number(signupGrade),
      class_no: Number(signupClassNo),
      student_no: Number(signupStudentNo),
      is_admin: false,
      is_approved: false,
    })

    if (profileError) {
      setSignupMessage(profileError.message)
      return
    }

    setSignupMessage('회원가입이 완료되었습니다. 이메일 인증 후 로그인하세요.')
    setCurrentPage('login')
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

    setLoginMessage('로그인 성공')
    setCurrentPage('home')
  }

  async function handleLogout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setCurrentPage('home')
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

  function updateScoreField(field: keyof typeof scoreForm, value: string) {
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

  function NavButton({ label, page }: { label: string; page: Page }) {
    const active = currentPage === page
    return (
      <button
        onClick={() => {
          setCurrentPage(page)
          setMobileMenuOpen(false)
        }}
        className={`text-sm font-semibold transition ${active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'}`}
      >
        {label}
      </button>
    )
  }

  function SectionShell({ eyebrow, title, description, children, wide = false }: { eyebrow: string; title: string; description: string; children: ReactNode; wide?: boolean }) {
    return (
      <div className={`mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-5xl'} rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10`}>
        <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">{eyebrow}</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    )
  }

  function SupabaseWarning() {
    if (supabaseEnabled) return null

    return (
      <div className="mx-auto mb-8 max-w-6xl rounded-[1.5rem] border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
        <span className="font-bold">Supabase 환경변수가 아직 연결되지 않았어.</span> 로컬에서는 <code className="rounded bg-white px-1 py-0.5">.env.local</code>, 배포본에서는 Vercel Environment Variables를 확인해줘.
      </div>
    )
  }

  function HomePage() {
    return (
      <div className="space-y-8">
        <section className="mx-auto max-w-6xl rounded-[2.5rem] border border-slate-200 bg-white px-8 py-14 shadow-sm md:px-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="text-sm font-semibold tracking-[0.22em] text-blue-700">CHEONGGO JEONGCHONG</div>
            <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-950 md:text-7xl">청주고정시파이터총연맹</h1>
            <div className="mt-4 text-2xl font-black tracking-[0.32em] text-blue-700">청.고.정.총</div>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-600">
              정시를 향해 함께 공부하고, 서로를 자극하며, 끝까지 흐름을 지켜내는 청주고 학습 공동체.
              기록보다 실력, 포장보다 축적, 흔들림보다 지속을 선택하는 사람들의 공간.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {[
              ['LIVE STATUS', '23명', '현재 study with 정시에서 공부 중인 인원'],
              ['TOP STUDY', '이승재', '누적 공부 시간 이번 주 랭킹 1위'],
              ["TODAY'S DRIVE", '418시간', '오늘 회원 전체 누적 공부 시간'],
            ].map(([eyebrow, value, desc], index) => (
              <div
                key={eyebrow}
                className={`rounded-[1.8rem] border p-6 text-left shadow-sm ${
                  index === 1 ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                }`}
              >
                <div className={`text-sm font-semibold tracking-[0.22em] ${index === 1 ? 'text-blue-100' : 'text-blue-700'}`}>{eyebrow}</div>
                <div className="mt-4 text-5xl font-black tracking-tight">{value}</div>
                <div className={`mt-3 text-sm leading-relaxed ${index === 1 ? 'text-blue-100' : 'text-slate-600'}`}>{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage('jeongsi-info')}
              className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              All About 정시 보기
            </button>
            {!isLoggedIn && (
              <button
                onClick={() => setCurrentPage('login')}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
              >
                로그인하기
              </button>
            )}
          </div>
        </section>
      </div>
    )
  }

  function LoginPage() {
    return (
      <SectionShell
        eyebrow="AUTH"
        title="로그인"
        description="이제 브라우저 임시 저장이 아니라 실제 Supabase 인증으로 로그인하는 구조야. 로그인은 이메일과 비밀번호로 진행해."
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
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
                onClick={() => setCurrentPage('signup')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
              >
                회원가입
              </button>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">NOTICE</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">실제 로그인 구조로 변경됨</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600">
              <p>이제 로그인 정보는 브라우저에만 저장되지 않고, Supabase 인증을 사용해 기기 간 동기화가 가능해.</p>
              <p>회원가입 직후에는 기본적으로 관리자 승인 전 상태로 저장되고, 승인 여부는 이후 관리자 기능으로 연결할 예정이야.</p>
              <p>현재 로그인 성공 후 상단바에 닉네임이 실제로 표시되고, 로그아웃도 실제 세션 종료로 동작해.</p>
            </div>
          </div>
        </div>
      </SectionShell>
    )
  }

  function SignupPage() {
    const passwordInvalid = signupPassword.length > 0 && (signupPassword.length < 8 || signupPassword.length > 20)
    const passwordMismatch = signupPasswordConfirm.length > 0 && signupPassword !== signupPasswordConfirm

    return (
      <SectionShell
        eyebrow="JOIN"
        title="청고정총에 오신 것을 환영합니다"
        description="이 페이지는 실제 Supabase 회원가입으로 연결되어 있어. 로그인용 값은 이메일과 비밀번호고, 아이디는 사이트 표시용 username으로 저장돼."
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
                  className={`w-full rounded-2xl border bg-white px-4 py-3 pr-16 outline-none transition ${passwordInvalid ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}
                  placeholder="8자 이상 20자 이하"
                />
                <button type="button" onClick={() => setShowSignupPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  {showSignupPassword ? '숨김' : '보기'}
                </button>
              </div>
              {passwordInvalid && <div className="mt-2 text-sm font-medium text-red-500">비밀번호는 8자 이상 20자 이하여야 합니다.</div>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showSignupPasswordConfirm ? 'text' : 'password'}
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 pr-16 outline-none transition ${passwordMismatch ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-400'}`}
                  placeholder="비밀번호 재입력"
                />
                <button type="button" onClick={() => setShowSignupPasswordConfirm((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  {showSignupPasswordConfirm ? '숨김' : '보기'}
                </button>
              </div>
              {passwordMismatch && <div className="mt-2 text-sm font-medium text-red-500">비밀번호가 서로 일치하지 않습니다.</div>}
            </div>
          </div>

          {signupMessage && <div className={`mt-5 text-sm font-medium ${signupMessage.includes('완료') ? 'text-blue-700' : 'text-red-500'}`}>{signupMessage}</div>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={handleSupabaseSignup} className="rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
              회원가입 신청
            </button>
            <button onClick={() => setCurrentPage('login')} className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
              로그인으로 이동
            </button>
          </div>
        </div>
      </SectionShell>
    )
  }

  function JeongsiPage() {
    return (
      <div className="space-y-8">
        <SectionShell
          eyebrow="ALL ABOUT JEONGSI"
          title="All About 정시"
          description="정시 관련 핵심 기능과 자료들을 한 번에 모아보는 메인 페이지야. 풀서비스는 아래 카드로 들어가고, 일정은 아래에서 바로 확인할 수 있어."
        >
          <button
            onClick={() => setCurrentPage('may-full-service')}
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
                실제 점수 DB 저장과 정렬은 다음 단계에서 `score_entries` 테이블을 붙여 완성할 예정이야. 지금은 실제 로그인과 승인 구조를 먼저 붙여 둔 상태야.
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
                            value={scoreForm[field as keyof typeof scoreForm]}
                            onChange={(e) => updateScoreField(field as keyof typeof scoreForm, e.target.value)}
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

  const topRightLabel = isLoggedIn ? currentUsername || currentName || currentUserEmail : '로그인'

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600">불러오는 중...</div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button onClick={() => setCurrentPage('home')} className="text-left">
            <div className="text-xl font-black tracking-tight text-slate-950">청고정총</div>
            <div className="text-sm text-slate-500">청주고 정시파이터 총연맹</div>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <NavButton label="단체 소개" page="home" />
            <NavButton label="서비스" page="jeongsi-info" />
            <NavButton label="커뮤니티" page="notice" />
            <NavButton label="공지사항" page="notice" />
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm">👤</span>
                <span>{topRightLabel}</span>
              </button>
            ) : (
              <button onClick={() => setCurrentPage('login')} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
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
              <NavButton label="단체 소개" page="home" />
              <NavButton label="서비스" page="jeongsi-info" />
              <NavButton label="커뮤니티" page="notice" />
              <NavButton label="공지사항" page="notice" />
              {isLoggedIn ? (
                <button onClick={handleLogout} className="mt-2 rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                  {topRightLabel} · 로그아웃
                </button>
              ) : (
                <button onClick={() => setCurrentPage('login')} className="mt-2 rounded-2xl bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white">
                  로그인
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-8 md:px-8 md:py-10">
        <SupabaseWarning />
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'signup' && <SignupPage />}
        {currentPage === 'jeongsi-info' && <JeongsiPage />}
        {currentPage === 'may-full-service' && <MayFullServicePage />}
        {currentPage === 'notice' && (
          <SectionShell
            eyebrow="NOTICE"
            title="공지사항"
            description="공지사항과 커뮤니티 영역은 다음 단계에서 실제 데이터베이스 연결과 함께 확장할 예정이야."
          >
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">현재는 실제 로그인 구조를 먼저 Supabase로 바꿔 둔 상태야.</div>
          </SectionShell>
        )}
      </main>
    </div>
  )
}
