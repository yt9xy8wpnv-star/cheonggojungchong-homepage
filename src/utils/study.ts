import { studySubjectOptions } from '../constants/siteData'
import type { StudyTimerRow, SubjectSecondsMap } from '../types'

export function createEmptySubjectSeconds(): SubjectSecondsMap {
  return Object.fromEntries(studySubjectOptions.map((subject) => [subject, 0])) as SubjectSecondsMap
}

export function normalizeSubjectSeconds(value: unknown): SubjectSecondsMap {
  const base = createEmptySubjectSeconds()
  if (!value || typeof value !== 'object') return base

  for (const subject of studySubjectOptions) {
    const raw = (value as Record<string, unknown>)[subject]
    const parsed = typeof raw === 'number' ? raw : Number(raw ?? 0)
    base[subject] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
  }

  return base
}

export function formatStudyDuration(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function getLeaderboardDisplayName(row: Pick<StudyTimerRow, 'username' | 'name' | 'user_id'>) {
  const username = typeof row.username === 'string' ? row.username.trim() : ''
  if (username) return username.includes('@') ? username.split('@')[0] : username

  const name = typeof row.name === 'string' ? row.name.trim() : ''
  if (name) return name

  return row.user_id.slice(0, 8)
}

export function getLeaderboardTotalSeconds(row: Pick<StudyTimerRow, 'current_seconds' | 'subject_seconds'>) {
  const currentSeconds = Number(row.current_seconds ?? 0)
  const normalizedCurrentSeconds = Number.isFinite(currentSeconds) && currentSeconds > 0 ? Math.floor(currentSeconds) : 0
  const subjectSeconds = normalizeSubjectSeconds(row.subject_seconds)
  const subjectSum = Object.values(subjectSeconds).reduce((sum, value) => sum + value, 0)

  return Math.max(normalizedCurrentSeconds, subjectSum)
}

export function normalizeStudyLeaderboardRows(rows: StudyTimerRow[]) {
  return [...rows]
    .map((row) => ({
      ...row,
      username: typeof row.username === 'string' ? row.username.trim() : row.username,
      name: typeof row.name === 'string' ? row.name.trim() : row.name,
      current_seconds: getLeaderboardTotalSeconds(row),
      subject_seconds: normalizeSubjectSeconds(row.subject_seconds),
    }))
    .sort((a, b) => {
      const secondGap = Number(b.current_seconds ?? 0) - Number(a.current_seconds ?? 0)
      if (secondGap !== 0) return secondGap

      const updatedAtA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const updatedAtB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return updatedAtB - updatedAtA
    })
}
