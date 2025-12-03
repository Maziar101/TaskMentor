type Goal = {
  id: string
  title: string
  desc: string
  due: string
  status: 'in-progress' | 'blocked' | 'done'
  impact: 'high' | 'medium' | 'low'
}

const goals: Goal[] = [
  {
    id: 'g1',
    title: 'بستن گزارش هفتگی تیم',
    desc: 'جمع‌بندی ریسک‌ها و تسک‌های مهم هفته جاری',
    due: 'این هفته',
    status: 'in-progress',
    impact: 'high',
  },
  {
    id: 'g2',
    title: 'تحویل نسخه MVP مشتری',
    desc: 'دموی قابل ارائه با چک‌لیست QA سبک',
    due: '۴ روز دیگر',
    status: 'blocked',
    impact: 'high',
  },
  {
    id: 'g3',
    title: 'مرتب‌سازی بک‌لاگ اسپرینت',
    desc: 'گروه‌بندی کارت‌ها و حذف آیتم‌های قدیمی',
    due: '۲ روز دیگر',
    status: 'in-progress',
    impact: 'medium',
  },
]

export default function ShortGoalsPage() {
  return (
    <div className="goals" dir="rtl">
      <header className="goals__header">
        <div>
          <p className="eyebrow">چشم‌انداز کوتاه</p>
          <h1>اهداف کوتاه‌مدت</h1>
          <p className="light">قابل تحویل‌های ۷ تا ۱۴ روزه همراه با وضعیت، ضرب‌الاجل، و اولویت.</p>
        </div>
        <button className="primary">افزودن هدف جدید</button>
      </header>

      <section className="goal-grid">
        {goals.map((goal) => (
          <article key={goal.id} className="goal-card">
            <div className="goal-card__top">
              <h3>{goal.title}</h3>
              <span className={`badge badge--${goal.status}`}>{statusLabel(goal.status)}</span>
            </div>
            <p className="light">{goal.desc}</p>
            <div className="goal-card__meta">
              <span className="pill">موعد: {goal.due}</span>
              <span className={`pill pill--${goal.impact}`}>{impactLabel(goal.impact)}</span>
            </div>
            <div className="progress">
              <span className={`progress__fill progress__fill--${goal.status}`} />
            </div>
          </article>
        ))}
      </section>

      <section className="goal-quick">
        <div className="panel compact">
          <p className="eyebrow">اقدام سریع</p>
          <p className="light">سه کاری که امروز باید انجام شود</p>
          <ul className="list">
            <li>بازبینی داک جدید</li>
            <li>هم‌راستایی با تیم مارکتینگ</li>
            <li>ارسال آپدیت برای استیک‌هولدرها</li>
          </ul>
        </div>
        <div className="panel compact">
          <p className="eyebrow">ریسک‌های فوری</p>
          <p className="light">نقاطی که ممکن است برنامه کوتاه‌مدت را کند کند.</p>
          <ul className="list">
            <li>وابستگی به API خارجی</li>
            <li>تاخیر طراحی صفحه پرداخت</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

function statusLabel(status: Goal['status']) {
  const map = {
    'in-progress': 'در حال انجام',
    blocked: 'مسدود',
    done: 'انجام شد',
  }
  return map[status]
}

function impactLabel(impact: Goal['impact']) {
  const map = {
    high: 'اولویت بالا',
    medium: 'اولویت متوسط',
    low: 'اولویت کم',
  }
  return map[impact]
}
