import type { ReactNode } from 'react'

type SectionShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  wide?: boolean
}

export default function SectionShell({ eyebrow, title, description, children, wide = false }: SectionShellProps) {
  return (
    <div className={`mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-5xl'} rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10`}>
      <div className="text-sm font-semibold tracking-[0.18em] text-blue-700">{eyebrow}</div>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}
