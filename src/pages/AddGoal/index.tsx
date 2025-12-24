import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { impactLabel, statusLabel } from '../../utils/labels/index'

type ShortGoal = {
  id: string
  title: string
  desc: string
  due: string
  status: 'in-progress' | 'blocked' | 'done'
  impact: 'high' | 'medium' | 'low'
}

type LongGoal = {
  id: string
  title: string
  horizon: string
  desc: string
  milestones: string[]
  owner: string
  risk: 'low' | 'medium' | 'high'
}

const defaultShort: ShortGoal[] = [
  {
    id: 'sg-1',
    title: 'لانچ نسخه ۰.۹',
    desc: 'برنامه انتشار نسخه بتا با تست دود و اطلاع‌رسانی محدود',
    due: '۱۰ روز',
    status: 'in-progress',
    impact: 'high',
  },
  {
    id: 'sg-2',
    title: 'پوشش QA حیاتی',
    desc: 'چک‌لیست ۱۲ موردی برای فیچرهای اصلی',
    due: '۷ روز',
    status: 'blocked',
    impact: 'medium',
  },
]

const defaultLong: LongGoal[] = [
  {
    id: 'lg-10',
    title: 'گسترش B2B',
    horizon: '۶ ماه آینده',
    desc: 'راه‌اندازی نسخه سازمانی و انعقاد ۳ قرارداد پایلوت',
    milestones: ['تحلیل نیازمندی سازمانی', 'قیمت‌گذاری و بسته‌بندی', 'پایلوت با ۲ مشتری'],
    owner: 'سارا - رشد',
    risk: 'medium',
  },
  {
    id: 'lg-11',
    title: 'بهبود رضایت مشتری',
    horizon: '۹ ماه آینده',
    desc: 'ارتقای NPS به ۵۵ با تمرکز بر پشتیبانی و تجربه کاربری',
    milestones: ['بازنگری جریان پشتیبانی', 'پایش NPS ماهانه', 'لانچ مرکز راهنما'],
    owner: 'امیر - محصول',
    risk: 'low',
  },
]

export default function AddGoalPage() {
  const [shortGoals, setShortGoals] = useState<ShortGoal[]>(defaultShort)
  const [longGoals, setLongGoals] = useState<LongGoal[]>(defaultLong)

  const [shortForm, setShortForm] = useState({
    title: '',
    desc: '',
    due: '',
    status: 'in-progress' as ShortGoal['status'],
    impact: 'high' as ShortGoal['impact'],
  })

  const [longForm, setLongForm] = useState({
    title: '',
    desc: '',
    horizon: '',
    milestones: '',
    owner: '',
    risk: 'medium' as LongGoal['risk'],
  })

  const completeness = useMemo(() => {
    const shortFill = Object.values(shortForm).filter(Boolean).length
    const longFill = Object.values(longForm).filter(Boolean).length
    return Math.min(100, Math.round(((shortFill + longFill) / 10) * 100))
  }, [shortForm, longForm])

  function handleCopyTitle(title: string) {
    const text = title.trim()
    if (!text) return
    if (navigator.clipboard && window.isSecureContext) {
      void navigator.clipboard.writeText(text)
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  function handleAddShort(e: FormEvent) {
    e.preventDefault()
    if (!shortForm.title.trim() || !shortForm.desc.trim() || !shortForm.due.trim()) return
    setShortGoals((prev) => [
      {
        id: crypto.randomUUID(),
        title: shortForm.title.trim(),
        desc: shortForm.desc.trim(),
        due: shortForm.due.trim(),
        status: shortForm.status,
        impact: shortForm.impact,
      },
      ...prev,
    ])
    setShortForm({ title: '', desc: '', due: '', status: 'in-progress', impact: 'high' })
  }

  function handleAddLong(e: FormEvent) {
    e.preventDefault()
    if (!longForm.title.trim() || !longForm.desc.trim() || !longForm.horizon.trim()) return
    const milestones = longForm.milestones
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)
    setLongGoals((prev) => [
      {
        id: crypto.randomUUID(),
        title: longForm.title.trim(),
        desc: longForm.desc.trim(),
        horizon: longForm.horizon.trim(),
        milestones: milestones.length ? milestones : ['تعیین مایلستون'],
        owner: longForm.owner.trim() || 'نامشخص',
        risk: longForm.risk,
      },
      ...prev,
    ])
    setLongForm({ title: '', desc: '', horizon: '', milestones: '', owner: '', risk: 'medium' })
  }

  return (
    <div className="goals goal-builder" dir="rtl">
      <header className="goals__header">
        <div>
          <p className="eyebrow">تعریف اهداف</p>
          <h1>افزودن هدف کوتاه‌مدت و بلندمدت</h1>
          <p className="light">
            هر دو افق را یکجا ثبت کن، ضرب‌الاجل و مایلستون مشخص بگذار و بعدا در صفحات اهداف
            دنبالشان کن.
          </p>
        </div>
        <div className="panel compact goal-builder__summary">
          <p className="eyebrow">پیشرفت تکمیل فرم</p>
          <div className="meter">
            <span style={{ width: `${completeness}%` }} />
          </div>
          <p className="small light">{completeness}% از فیلدهای کلیدی پر شده</p>
        </div>
      </header>

      <section className="builder-grid">
        <form className="panel form-panel" onSubmit={handleAddShort}>
          <div className="panel__header">
            <div>
              <p className="eyebrow">کوتاه‌مدت</p>
              <h2>ثبت هدف ۷ تا ۱۴ روزه</h2>
            </div>
            <span className="pill pill--focus">تحویل سریع</span>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>عنوان</span>
              <input
                value={shortForm.title}
                onChange={(e) => setShortForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثلا: تحویل نسخه بتا به مشتری"
              />
            </label>
            <label className="field">
              <span>ضرب‌الاجل</span>
              <input
                value={shortForm.due}
                onChange={(e) => setShortForm((p) => ({ ...p, due: e.target.value }))}
                placeholder="۷ روز / این هفته"
              />
            </label>
            <label className="field field--wide">
              <span>توضیح</span>
              <textarea
                value={shortForm.desc}
                onChange={(e) => setShortForm((p) => ({ ...p, desc: e.target.value }))}
                placeholder="چرا این هدف مهم است و تعریف موفقیت چیست؟"
              />
            </label>
            <label className="field">
              <span>وضعیت</span>
              <select
                value={shortForm.status}
                onChange={(e) =>
                  setShortForm((p) => ({ ...p, status: e.target.value as ShortGoal['status'] }))
                }
              >
                <option value="in-progress">در حال انجام</option>
                <option value="blocked">مسدود</option>
                <option value="done">تمام شد</option>
              </select>
            </label>
            <label className="field">
              <span>اثر</span>
              <select
                value={shortForm.impact}
                onChange={(e) =>
                  setShortForm((p) => ({ ...p, impact: e.target.value as ShortGoal['impact'] }))
                }
              >
                <option value="high">بالا</option>
                <option value="medium">متوسط</option>
                <option value="low">کم</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">
              افزودن هدف کوتاه‌مدت
            </button>
            <span className="light small">در پیش‌نمایش پایین ذخیره می‌شود</span>
          </div>
        </form>

        <form className="panel form-panel" onSubmit={handleAddLong}>
          <div className="panel__header">
            <div>
              <p className="eyebrow">بلندمدت</p>
              <h2>ثبت هدف ۳ تا ۱۲ ماهه</h2>
            </div>
            <span className="pill pill--meeting">چشم‌انداز</span>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>عنوان</span>
              <input
                value={longForm.title}
                onChange={(e) => setLongForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثلا: آماده‌سازی برای بازار منطقه‌ای"
              />
            </label>
            <label className="field">
              <span>افق زمانی</span>
              <input
                value={longForm.horizon}
                onChange={(e) => setLongForm((p) => ({ ...p, horizon: e.target.value }))}
                placeholder="۶ ماه / ۹ ماه"
              />
            </label>
            <label className="field">
              <span>مالک</span>
              <input
                value={longForm.owner}
                onChange={(e) => setLongForm((p) => ({ ...p, owner: e.target.value }))}
                placeholder="مسئول اصلی (مثلا: رهبر محصول)"
              />
            </label>
            <label className="field">
              <span>ریسک</span>
              <select
                value={longForm.risk}
                onChange={(e) =>
                  setLongForm((p) => ({ ...p, risk: e.target.value as LongGoal['risk'] }))
                }
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
              </select>
            </label>
            <label className="field field--wide">
              <span>توضیح</span>
              <textarea
                value={longForm.desc}
                onChange={(e) => setLongForm((p) => ({ ...p, desc: e.target.value }))}
                placeholder="هدف چه تاثیری دارد و معیار موفقیت چیست؟"
              />
            </label>
            <label className="field field--wide">
              <span>مایلستون‌ها (هر خط یک مورد)</span>
              <textarea
                value={longForm.milestones}
                onChange={(e) => setLongForm((p) => ({ ...p, milestones: e.target.value }))}
                placeholder={'نمونه:\nتحقیق بازار\nپروتوتایپ\nاولین مشتری پایلوت'}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">
              افزودن هدف بلندمدت
            </button>
            <span className="light small">لیست پایین به‌روزرسانی می‌شود</span>
          </div>
        </form>
      </section>

      <section className="goal-previews">
        <div className="panel compact">
          <div className="panel__header">
            <h3>پیش‌نمایش اهداف کوتاه‌مدت</h3>
            <span className="pill pill--focus">{shortGoals.length} هدف</span>
          </div>
          <div className="goal-preview__list">
            {shortGoals.map((goal) => (
              <article key={goal.id} className="goal-preview">
                <div className="goal-card__top">
                  <h4
                    className="goal-card__title"
                    onMouseDown={(e) => e.preventDefault()}
                    onDoubleClick={() => handleCopyTitle(goal.title)}
                  >
                    {goal.title}
                  </h4>
                  <span className={`badge badge--${goal.status}`}>{statusLabel(goal.status)}</span>
                </div>
                <p className="light small">{goal.desc}</p>
                <div className="goal-card__meta">
                  <span className="pill">ضرب‌الاجل: {goal.due}</span>
                  <span className={`pill pill--${goal.impact}`}>{impactLabel(goal.impact)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel compact">
          <div className="panel__header">
            <h3>پیش‌نمایش اهداف بلندمدت</h3>
            <span className="pill pill--meeting">{longGoals.length} هدف</span>
          </div>
          <div className="goal-preview__list">
            {longGoals.map((goal) => (
              <article key={goal.id} className="goal-preview">
                <div className="goal-card__top">
                  <h4
                    className="goal-card__title"
                    onMouseDown={(e) => e.preventDefault()}
                    onDoubleClick={() => handleCopyTitle(goal.title)}
                  >
                    {goal.title}
                  </h4>
                  <span className="pill">افق: {goal.horizon}</span>
                </div>
                <p className="light small">{goal.desc}</p>
                <div className="goal-card__meta">
                  <span className="pill pill--solid">{goal.owner}</span>
                  <span className={`pill pill--${goal.risk === 'high' ? 'errand' : 'focus'}`}>
                    ریسک: {riskLabel(goal.risk)}
                  </span>
                </div>
                <div className="milestones">
                  {goal.milestones.map((m, idx) => (
                    <div key={idx} className="milestone">
                      <span className="dot dot--pending" />
                      <span className="light small">{m}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}


function riskLabel(risk: LongGoal['risk']) {
  const map = {
    low: 'کم',
    medium: 'متوسط',
    high: 'زیاد',
  }
  return map[risk]
}
