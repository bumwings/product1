import { useState, useCallback, useEffect } from 'react'

export type Cell = { id: string; title: string; note: string }

const GRID_SIZE = 9
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE
const CENTER_CELL_INDEX = 4 * GRID_SIZE + 4
const CENTER_CELL_ID = `cell-${CENTER_CELL_INDEX}`

const HERO_STORAGE_KEYS = { title: 'mandala_heroTitle', subtitle: 'mandala_heroSubtitle' } as const

const initialCells: Cell[] = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
  id: `cell-${i}`,
  title: '',
  note: '',
}))

/** 中央ブロック周辺8マス → 外側ブロック中心のセル index 対応（中央→外のみ） */
const CENTER_TO_OUTER_INDEX: Record<number, number> = {
  30: 10, 31: 13, 32: 16, 39: 37, 41: 43, 48: 64, 49: 67, 50: 70,
}

export default function App() {
  const [cells, setCells] = useState<Cell[]>(initialCells)
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const [heroTitle, setHeroTitle] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(HERO_STORAGE_KEYS.title) ?? '' : ''
  )
  const [heroSubtitle, setHeroSubtitle] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(HERO_STORAGE_KEYS.subtitle) ?? '' : ''
  )
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | null>(null)
  const [editingDraft, setEditingDraft] = useState('')

  const selectedCell = cells.find((c) => c.id === selectedCellId)

  /* 初回: localStorage の heroTitle を中心セルに反映 */
  useEffect(() => {
    const saved = localStorage.getItem(HERO_STORAGE_KEYS.title)
    if (saved) {
      setCells((prev) =>
        prev.map((c, i) => (i === CENTER_CELL_INDEX ? { ...c, title: saved } : c))
      )
    }
  }, [])

  /* heroTitle / heroSubtitle を localStorage に保存 */
  useEffect(() => {
    localStorage.setItem(HERO_STORAGE_KEYS.title, heroTitle)
    localStorage.setItem(HERO_STORAGE_KEYS.subtitle, heroSubtitle)
  }, [heroTitle, heroSubtitle])

  const openPanel = useCallback((id: string) => {
    setSelectedCellId(id)
    setIsPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  const updateCell = useCallback((id: string, updates: Partial<Pick<Cell, 'title' | 'note'>>) => {
    setCells((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }, [])

  const handleTitleChange = useCallback(
    (id: string, value: string) => {
      const index = parseInt(id.replace('cell-', ''), 10)
      const outerIndex = CENTER_TO_OUTER_INDEX[index]
      if (outerIndex !== undefined) {
        setCells((prev) =>
          prev.map((c) => {
            const cIndex = parseInt(c.id.replace('cell-', ''), 10)
            if (c.id === id) return { ...c, title: value }
            if (cIndex === outerIndex) return { ...c, title: value }
            return c
          })
        )
      } else {
        updateCell(id, { title: value })
      }
      if (id === CENTER_CELL_ID) setHeroTitle(value)
    },
    [updateCell]
  )

  const handleNoteChange = useCallback(
    (id: string, value: string) => updateCell(id, { note: value }),
    [updateCell]
  )

  const startEditing = useCallback((field: 'title' | 'subtitle') => {
    setEditingField(field)
    setEditingDraft(field === 'title' ? heroTitle : heroSubtitle)
  }, [heroTitle, heroSubtitle])

  const commitEditing = useCallback(() => {
    if (editingField === 'title') {
      const v = editingDraft.trim()
      setHeroTitle(v)
      updateCell(CENTER_CELL_ID, { title: v })
    } else if (editingField === 'subtitle') {
      setHeroSubtitle(editingDraft.trim())
    }
    setEditingField(null)
  }, [editingField, editingDraft, updateCell])

  const cancelEditing = useCallback(() => {
    setEditingField(null)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">Mandala Focus</h1>
        <p className="header-subtitle">中心から広げる思考整理ツール</p>
      </header>

      <section className="hero" aria-label="今期のテーマ">
        <div className="hero-card">
          <div className={`hero-status ${!editingField && (heroTitle || heroSubtitle) ? 'hero-status--saved' : ''}`} aria-live="polite">
            {editingField ? 'Editing…' : 'Saved'}
          </div>
          <span className="hero-label">LIFE THEME 2026</span>
          {editingField === 'title' ? (
            <input
              type="text"
              className="hero-title-input"
              value={editingDraft}
              onChange={(e) => setEditingDraft(e.target.value)}
              onBlur={commitEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitEditing()
                }
                if (e.key === 'Escape') {
                  setEditingDraft(heroTitle)
                  cancelEditing()
                }
              }}
              autoFocus
              aria-label="メインの宣言文"
            />
          ) : (
            <button
              type="button"
              className={`hero-title-display ${!heroTitle ? 'hero-title-display--empty' : ''}`}
              onClick={() => startEditing('title')}
              aria-label="メインの宣言文を編集"
            >
              <span className="hero-title-text">
                {heroTitle || '知的体力を高める一年'}
              </span>
              <span className="hero-edit-hint">編集</span>
            </button>
          )}
          {editingField === 'subtitle' ? (
            <textarea
              className="hero-subtitle-input"
              value={editingDraft}
              onChange={(e) => setEditingDraft(e.target.value)}
              onBlur={commitEditing}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingDraft(heroSubtitle)
                  cancelEditing()
                }
              }}
              rows={2}
              autoFocus
              aria-label="補足説明"
            />
          ) : (
            <button
              type="button"
              className={`hero-subtitle-display ${!heroSubtitle ? 'hero-subtitle-display--empty' : ''}`}
              onClick={() => startEditing('subtitle')}
              aria-label="補足説明を編集"
            >
              <span className="hero-subtitle-text">
                {heroSubtitle || '中心から広げて、目標を行動まで落とし込みます。'}
              </span>
              <span className="hero-edit-hint">編集</span>
            </button>
          )}
        </div>
      </section>

      <div className="board-wrap">
        <div className="grid" role="grid" aria-label="9x9 マンダラ">
        {cells.map((cell, index) => {
          const row = Math.floor(index / GRID_SIZE)
          const col = index % GRID_SIZE
          const blockRow = Math.floor(row / 3)
          const blockCol = Math.floor(col / 3)
          const blockIndex = blockRow * 3 + blockCol
          const borderRight = col === 2 || col === 5
          const borderBottom = row === 2 || row === 5
          const isSelected = selectedCellId === cell.id
          const isCentralBlock = row >= 3 && row <= 5 && col >= 3 && col <= 5
          const isCenter = index === 4 * GRID_SIZE + 4
          return (
          <div
            key={cell.id}
            className={`cell-card block-${blockIndex} ${borderRight ? 'cell-card--border-right' : ''} ${borderBottom ? 'cell-card--border-bottom' : ''} ${isSelected ? 'cell-card--selected' : ''} ${isCentralBlock ? 'cell-card--central' : ''} ${isCenter ? 'cell-card--center' : ''}`}
            role="gridcell"
            tabIndex={0}
            aria-label={cell.title ? `タイトル: ${cell.title}` : 'タイトル未入力、クリックで編集'}
            onMouseDownCapture={() => openPanel(cell.id)}
            onClick={() => openPanel(cell.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPanel(cell.id)
              }
            }}
          >
            <div className="cell-label" aria-hidden="true">
              {cell.title || '\u00A0'}
            </div>
          </div>
          )
        })}
        </div>
      </div>

      <div
        className={`panel-overlay ${isPanelOpen ? 'panel-overlay--open' : ''}`}
        onClick={closePanel}
        aria-hidden={!isPanelOpen}
      />

      <aside
        className={`detail-panel ${isPanelOpen ? 'detail-panel--open' : ''}`}
        aria-label="選択中のマス詳細"
        aria-hidden={!isPanelOpen}
      >
        <div className="detail-panel-inner">
          <button
            type="button"
            className="panel-close"
            onClick={closePanel}
            aria-label="パネルを閉じる"
          >
            ×
          </button>

          {selectedCell && (
            <div className="detail-form">
              <h2 className="detail-heading">詳細</h2>
              <label className="detail-label">
                タイトル
                <input
                  type="text"
                  className="detail-input"
                  value={selectedCell.title}
                  onChange={(e) =>
                    handleTitleChange(selectedCell.id, e.target.value)
                  }
                />
              </label>
              <label className="detail-label">
                詳細メモ
                <textarea
                  className="detail-textarea"
                  value={selectedCell.note}
                  onChange={(e) =>
                    handleNoteChange(selectedCell.id, e.target.value)
                  }
                  rows={8}
                  placeholder="メモを入力..."
                />
              </label>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
