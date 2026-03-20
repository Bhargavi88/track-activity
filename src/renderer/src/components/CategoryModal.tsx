import { useState } from 'react'
import type { CategoryName } from '../types'
import { CATEGORY_COLORS } from '../types'

const CATEGORIES: CategoryName[] = [
  'Development',
  'Browser',
  'Communication',
  'Design',
  'Productivity',
  'Entertainment',
  'System',
  'Other'
]

interface CategoryModalProps {
  appName: string
  currentCategory: string
  onSave: (category: string) => void
  onClose: () => void
}

export default function CategoryModal({
  appName,
  currentCategory,
  onSave,
  onClose
}: CategoryModalProps): JSX.Element {
  const [selected, setSelected] = useState<string>(currentCategory)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-bg-card border border-border rounded-2xl p-6 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-text-primary mb-1">Set Category</h3>
        <p className="text-sm text-text-muted mb-4 truncate">{appName}</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                selected === cat
                  ? 'bg-opacity-20 border border-opacity-50 font-medium'
                  : 'bg-bg-hover border border-transparent text-text-secondary hover:text-text-primary'
              }`}
              style={
                selected === cat
                  ? {
                      backgroundColor: CATEGORY_COLORS[cat as CategoryName] + '33',
                      borderColor: CATEGORY_COLORS[cat as CategoryName] + '88',
                      color: CATEGORY_COLORS[cat as CategoryName]
                    }
                  : {}
              }
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat as CategoryName] }}
              />
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-bg-hover border border-border text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            className="flex-1 px-4 py-2 rounded-lg bg-accent-purple text-white text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
