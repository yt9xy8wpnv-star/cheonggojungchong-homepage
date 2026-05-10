type DropdownNavProps = {
  label: string
  items: readonly (readonly [string, string])[]
  id: string
  isOpen: boolean
  isActive: boolean
  onOpen: () => void
  onClose: () => void
  onNavigate: (path: string) => void
}

export default function DropdownNav({ label, items, isOpen, isActive, onOpen, onClose, onNavigate }: DropdownNavProps) {
  return (
    <div className="relative pt-2" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        onClick={() => {
          if (isOpen) {
            onClose()
          } else {
            onOpen()
          }
        }}
        className={`inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-semibold transition ${isActive ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'}`}
      >
        <span>{label}</span>
        <span className={`text-xs transition ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div
          className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          onMouseEnter={onOpen}
          onMouseLeave={onClose}
        >
          {items.map(([itemLabel, path], index) => (
            <button
              key={path}
              onClick={() => onNavigate(path)}
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
