import { useEffect, useMemo, useState } from 'react'

type Task = {
  id: string
  title: string
  tag?: 'focus' | 'meeting' | 'errand'
}

type ScheduledTask = Task & {
  hour: number
  day: string
}

type MergedBlock = {
  task: ScheduledTask
  start: number
  end: number
}

type StorageShape = {
  pool: Task[]
  schedule: Record<string, ScheduledTask[]>
  notes?: Record<string, string>
}

const STORAGE_KEY = 'taskmentor-data'

const defaultPool: Task[] = [
  { id: 'task-1', title: 'Deep work: main project', tag: 'focus' },
  { id: 'task-2', title: 'Team sync', tag: 'meeting' },
  { id: 'task-3', title: 'Email + admin', tag: 'errand' },
  { id: 'task-4', title: 'Personal learning block', tag: 'focus' },
  { id: 'task-5', title: 'ورزش کوتاه ۳۰ دقیقه', tag: 'errand' },
  { id: 'task-6', title: 'پیگیری مشتریان کلیدی', tag: 'meeting' },
]

const tagLabels: Record<NonNullable<Task['tag']>, string> = {
  focus: 'تمرکز',
  meeting: 'جلسه',
  errand: 'کارهای ریز',
}

const hours = Array.from({ length: 24 }, (_, i) => i)

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, '0')}:00`
}

function todayKey() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

function readStorage(): StorageShape {
  if (typeof window === 'undefined') return { pool: defaultPool, schedule: {} }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { pool: defaultPool, schedule: {} }
  try {
    const parsed = JSON.parse(raw) as StorageShape
    return {
      pool: parsed.pool ?? defaultPool,
      schedule: parsed.schedule ?? {},
      notes: parsed.notes ?? {},
    }
  } catch (e) {
    console.warn('Failed to parse stored data, resetting.', e)
    return { pool: defaultPool, schedule: {} }
  }
}

export default function PlannerPage() {
  const [activeDay, setActiveDay] = useState<string>(todayKey())
  const [pool, setPool] = useState<Task[]>(() => readStorage().pool)
  const [schedule, setSchedule] = useState<Record<string, ScheduledTask[]>>(
    () => readStorage().schedule,
  )
  const [notes, setNotes] = useState<Record<string, string>>(() => readStorage().notes ?? {})
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTag, setNewTaskTag] = useState<Task['tag']>()
  const [filterTag, setFilterTag] = useState<NonNullable<Task['tag']> | 'all'>('all')
  const [search, setSearch] = useState('')
  const [hoverHour, setHoverHour] = useState<number | null>(null)

  useEffect(() => {
    const payload: StorageShape = { pool, schedule, notes }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [pool, schedule, notes])

  const daySchedule = useMemo(() => schedule[activeDay] ?? [], [schedule, activeDay])

  const occupancy = useMemo(() => {
    const uniqueHours = new Set(daySchedule.map((t) => t.hour))
    const filled = uniqueHours.size
    return Math.min(100, Math.round((filled / hours.length) * 100))
  }, [daySchedule])

  const mergedBlocks = useMemo(() => mergeConsecutive(daySchedule), [daySchedule])

  const blocksByStart = useMemo(() => {
    const map = new Map<number, MergedBlock>()
    mergedBlocks.forEach((b) => map.set(b.start, b))
    return map
  }, [mergedBlocks])

  const coveringBlocks = useMemo(() => {
    const map = new Map<number, MergedBlock>()
    mergedBlocks.forEach((b) => {
      for (let h = b.start + 1; h < b.end; h += 1) {
        map.set(h, b)
      }
    })
    return map
  }, [mergedBlocks])

  const tagStats = useMemo(() => {
    return daySchedule.reduce(
      (acc, curr) => {
        if (curr.tag) acc[curr.tag] += 1
        return acc
      },
      { focus: 0, meeting: 0, errand: 0 },
    )
  }, [daySchedule])

  const previousDays = useMemo(() => {
    const keys = Object.keys(schedule)
    return keys
      .filter((k) => k !== activeDay)
      .sort()
      .slice(-4)
      .reverse()
  }, [schedule, activeDay])

  function persistSchedule(dayKey: string, tasks: ScheduledTask[]) {
    const cleaned = dedupe(tasks)
    setSchedule((prev) => ({ ...prev, [dayKey]: cleaned }))
  }

  function copyLatestDayIntoActive() {
    const source = previousDays[0]
    if (!source) return
    const sourceTasks = schedule[source] ?? []
    const cloned = sourceTasks.map((t) => ({ ...t, id: crypto.randomUUID(), day: activeDay }))
    persistSchedule(activeDay, sortByHour(cloned))
  }

  function clearActiveDay() {
    const tasks = schedule[activeDay] ?? []
    if (tasks.length === 0) return
    setPool((prev) => [...tasks.map((t) => ({ id: t.id, title: t.title, tag: t.tag })), ...prev])
    persistSchedule(activeDay, [])
  }

  function handleAddTask() {
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    const task: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      tag: newTaskTag,
    }
    setPool((prev) => [task, ...prev])
    setNewTaskTitle('')
  }

  function handleDrop(hour: number, data: string) {
    let parsed: { type: 'pool' | 'scheduled'; id: string; day?: string } | null = null
    try {
      parsed = JSON.parse(data)
    } catch {
      return
    }
    if (!parsed) return

    if (parsed.type === 'pool') {
      setPool((prev) => {
        const task = prev.find((t) => t.id === parsed?.id)
        if (!task) return prev
        const updated = prev.filter((t) => t.id !== task.id)
        const newScheduled: ScheduledTask = { ...task, hour, day: activeDay }
        const list = schedule[activeDay] ?? []
        const withoutExisting = list.filter((t) => t.id !== task.id)
        persistSchedule(activeDay, sortByHour([...withoutExisting, newScheduled]))
        return updated
      })
    }

    if (parsed.type === 'scheduled') {
      const fromDay = parsed.day ?? activeDay
      const existing = schedule[fromDay] ?? []
      const task = existing.find((t) => t.id === parsed?.id)
      if (!task) return

      const updatedSource = existing.filter((t) => t.id !== task.id)
      persistSchedule(fromDay, sortByHour(updatedSource))

      const targetList = schedule[activeDay] ?? []
      const withoutDup = targetList.filter((t) => t.id !== task.id)
      const moved = { ...task, hour, day: activeDay }
      persistSchedule(activeDay, sortByHour([...withoutDup, moved]))
    }
  }

  function handleReturnBlock(block: MergedBlock) {
    const fromDay = block.task.day
    const fromList = schedule[fromDay] ?? []
    const remaining = fromList.filter((t) => {
      const sameTitle = t.title.trim().toLowerCase() === block.task.title.trim().toLowerCase()
      const sameTag = t.tag === block.task.tag
      const inRange = t.hour >= block.start && t.hour < block.end
      return !(sameTitle && sameTag && inRange)
    })
    persistSchedule(fromDay, sortByHour(remaining))
    setPool((prev) => [
      { id: crypto.randomUUID(), title: block.task.title, tag: block.task.tag },
      ...prev,
    ])
  }

  function handleDeleteBlock(block: MergedBlock) {
    const fromDay = block.task.day
    const fromList = schedule[fromDay] ?? []
    const remaining = fromList.filter((t) => {
      const sameTitle = t.title.trim().toLowerCase() === block.task.title.trim().toLowerCase()
      const sameTag = t.tag === block.task.tag
      const inRange = t.hour >= block.start && t.hour < block.end
      return !(sameTitle && sameTag && inRange)
    })
    persistSchedule(fromDay, sortByHour(remaining))
  }

  function handleDeletePoolTask(taskId: string) {
    setPool((prev) => prev.filter((t) => t.id !== taskId))
  }

  function handleDeleteAllPool() {
    setPool([])
  }

  function handleDayShift(delta: number) {
    const base = new Date(activeDay)
    base.setDate(base.getDate() + delta)
    setActiveDay(base.toISOString().slice(0, 10))
  }

  const dayLabel = useMemo(() => {
    const date = new Date(activeDay)
    return date.toLocaleDateString('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [activeDay])

  const filteredPool = useMemo(() => {
    const term = search.trim().toLowerCase()
    return pool.filter((task) => {
      const matchesTag = filterTag === 'all' ? true : task.tag === filterTag
      const matchesSearch = term.length === 0 ? true : task.title.toLowerCase().includes(term)
      return matchesTag && matchesSearch
    })
  }, [pool, filterTag, search])

  return (
    <div className="planner" dir="rtl">
      <div className="planner__header">
        <div>
          <p className="eyebrow">نمای ۲۴ ساعته</p>
          <h1>{dayLabel}</h1>
          <p className="light">تسک‌ها را بکش و روی ساعت مناسب رها کن</p>
        </div>
        <div className="topbar__controls">
          <button onClick={() => handleDayShift(-1)} className="ghost" type="button">
            روز قبل
          </button>
          <button onClick={() => setActiveDay(todayKey())} className="ghost" type="button">
            امروز
          </button>
          <button onClick={() => handleDayShift(1)} className="ghost" type="button">
            روز بعد
          </button>
          <button onClick={copyLatestDayIntoActive} className="ghost" type="button">
            کپی از روز قبلی
          </button>
          <button onClick={clearActiveDay} className="ghost" type="button">
            خالی کردن روز
          </button>
        </div>
      </div>

      <div className="planner__body">
        <section className="planner__backlog">
          <div className="panel">
            <header className="panel__header">
              <div>
                <p className="eyebrow">ورودی سریع</p>
                <h2>لیست در انتظار</h2>
              </div>
              <div className="counts">
                <span>در انتظار: {pool.length}</span>
                <span>امروز: {daySchedule.length}</span>
              </div>
            </header>
            <div className="add-form">
              <input
                placeholder="چی تو ذهنت هست؟"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask()
                }}
              />
              <div className="tag-choices">
                {(['focus', 'meeting', 'errand'] as NonNullable<Task['tag']>[]).map((tag) => (
                  <button
                    key={tag}
                    className={['tag-chip', newTaskTag === tag && 'tag-chip--active']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setNewTaskTag((prev) => (prev === tag ? undefined : tag))}
                    type="button"
                  >
                    {tagLabels[tag]}
                  </button>
                ))}
              </div>
              <button className="primary" onClick={handleAddTask}>
                اضافه کن
              </button>
            </div>
            <div className="filters">
              <input
                placeholder="جستجو در لیست..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="filter-tags">
                <button
                  type="button"
                  className={['pill', filterTag === 'all' && 'pill--solid'].filter(Boolean).join(' ')}
                  onClick={() => setFilterTag('all')}
                >
                  همه
                </button>
                {(['focus', 'meeting', 'errand'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={['pill', filterTag === tag && 'pill--solid'].filter(Boolean).join(' ')}
                    onClick={() => setFilterTag(tag)}
                  >
                    {tagLabels[tag]}
                  </button>
                ))}
              </div>
              <div className="filter-actions">
                <button className="ghost tiny" type="button" onClick={handleDeleteAllPool}>
                  حذف همه لیست
                </button>
              </div>
            </div>
            <div className="pool" aria-label="Backlog">
              {filteredPool.length === 0 && <p className="empty">چیزی پیدا نشد</p>}
              {filteredPool.map((task) => (
                <article
                  key={task.id}
                  className="task"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({ type: 'pool', id: task.id }),
                    )
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <div className="task__title">{task.title}</div>
                  <div className="task__meta">
                    {task.tag && <span className={`pill pill--${task.tag}`}>{tagLabels[task.tag]}</span>}
                    <button className="danger tiny" type="button" onClick={() => handleDeletePoolTask(task.id)}>
                      حذف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="planner__board">
          <div className="notes">
            <div>
              <p className="eyebrow">یادداشت روز</p>
              <p className="light">هر چیزی که باید یادت باشد یا حس کلی روز</p>
            </div>
            <textarea
              value={notes[activeDay] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [activeDay]: e.target.value }))}
              placeholder="یادداشت سریع..."
            />
          </div>

          <section className="grid" aria-label="24 hour grid">
            {hours.map((hour) => {
              const blockStart = blocksByStart.get(hour)
              const covered = coveringBlocks.get(hour)
              return (
                <div
                  key={hour}
                  className={[
                    'slot',
                    hoverHour === hour && 'slot--hover',
                    covered && 'slot--covered',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setHoverHour(hour)
                  }}
                  onDragLeave={() => setHoverHour((prev) => (prev === hour ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault()
                    const data = e.dataTransfer.getData('application/json')
                    handleDrop(hour, data)
                    setHoverHour(null)
                  }}
                >
                  <div className="slot__label">{formatHour(hour)}</div>
                  <div className="slot__content">
                    {!blockStart && !covered && <span className="hint">درگ کنید</span>}
                    {blockStart && (
                      <article
                        className="task task--scheduled task--merged"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'application/json',
                            JSON.stringify({
                              type: 'scheduled',
                              id: blockStart.task.id,
                              day: blockStart.task.day,
                            }),
                          )
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                      >
                        <div className="task__title">{blockStart.task.title}</div>
                        <div className="task__meta">
                          <span className="light small">
                            {formatHour(blockStart.start)} تا {formatHour(blockStart.end % 24)}
                            {` · ${blockStart.end - blockStart.start} ساعت`}
                          </span>
                          {blockStart.task.tag && (
                            <span className={`pill pill--${blockStart.task.tag}`}>
                              {tagLabels[blockStart.task.tag]}
                            </span>
                          )}
                          <div className="task__meta-actions">
                            <button className="ghost tiny" type="button" onClick={() => handleReturnBlock(blockStart)}>
                              برگردان به لیست
                            </button>
                            <button className="danger tiny" type="button" onClick={() => handleDeleteBlock(blockStart)}>
                              حذف
                            </button>
                          </div>
                        </div>
                      </article>
                    )}
                    {covered && !blockStart && <span className="hint">ادامه همین تسک</span>}
                  </div>
                </div>
              )
            })}
          </section>

          <div className="stats-row">
            <div className="panel compact">
              <p className="eyebrow">پیشروی امروز</p>
              <div className="meter">
                <span style={{ width: `${occupancy}%` }} />
              </div>
              <p className="light">{occupancy}% از ۲۴ ساعت پر شده</p>
            </div>
            <div className="panel compact">
              <p className="eyebrow">توزیع برچسب</p>
              <div className="tag-stats">
                <div className="tag-stats__row">
                  <span>تمرکز</span>
                  <span className="light">{tagStats.focus}</span>
                </div>
                <div className="tag-stats__row">
                  <span>جلسه</span>
                  <span className="light">{tagStats.meeting}</span>
                </div>
                <div className="tag-stats__row">
                  <span>کارهای ریز</span>
                  <span className="light">{tagStats.errand}</span>
                </div>
              </div>
            </div>
            <div className="panel compact">
              <p className="eyebrow">روزهای اخیر</p>
              <div className="history__days">
                {previousDays.length === 0 && <span className="light">هنوز چیزی ثبت نشده</span>}
                {previousDays.map((d) => (
                  <button
                    key={d}
                    className="history__chip"
                    onClick={() => setActiveDay(d)}
                    type="button"
                  >
                    {new Date(d).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function sortByHour(list: ScheduledTask[]) {
  return [...list].sort((a, b) => a.hour - b.hour || a.title.localeCompare(b.title))
}

function mergeConsecutive(list: ScheduledTask[]): MergedBlock[] {
  if (list.length === 0) return []
  const sorted = sortByHour(dedupe(list))
  const merged: MergedBlock[] = []
  let current: MergedBlock | null = null

  for (const item of sorted) {
    if (!current) {
      current = { task: item, start: item.hour, end: item.hour + 1 }
      continue
    }

    const isConsecutive = item.hour === current.end
    const isSameTask =
      item.title.trim().toLowerCase() === current.task.title.trim().toLowerCase() &&
      item.tag === current.task.tag

    if (isConsecutive && isSameTask) {
      current.end = item.hour + 1
    } else {
      merged.push(current)
      current = { task: item, start: item.hour, end: item.hour + 1 }
    }
  }

  if (current) merged.push(current)
  return merged
}

function dedupe(list: ScheduledTask[]) {
  const map = new Map<string, ScheduledTask>()
  list.forEach((t) => {
    const key = `${t.title.trim().toLowerCase()}|${t.tag ?? 'none'}|${t.hour}|${t.day}`
    map.set(key, t)
  })
  return Array.from(map.values()).sort((a, b) => a.hour - b.hour || a.title.localeCompare(b.title))
}
