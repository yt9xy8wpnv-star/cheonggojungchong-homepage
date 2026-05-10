export type ProfileRow = {
  username: string
  name: string
  grade: number | null
  class_no: number | null
  student_no: number | null
  created_at: string | null
  is_admin: boolean
  is_approved: boolean
}

export type SignupSubjectSelections = {
  korean: string
  math: string
  english: string
  inquiry1: string
  inquiry2: string
  secondForeign: string
}

export type ScoreForm = {
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

export type SubjectSecondsMap = Record<string, number>

export type StudyTimerRow = {
  user_id: string
  username: string | null
  name: string | null
  current_seconds: number | null
  is_running: boolean | null
  current_subject: string | null
  subject_seconds: unknown
  updated_at: string | null
}
