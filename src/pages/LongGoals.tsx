type Goal = {
  id: string
  title: string
  horizon: string
  desc: string
  milestones: { label: string; done: boolean }[]
}

const goals: Goal[] = [
  {
    id: 'lg1',
    title: 'ارتقای زیرساخت و تحمل‌پذیری بالا',
    horizon: '۳ تا ۶ ماه',
    desc: 'مهاجرت تدریجی به معماری میکروسرویس و اتوماسیون CI/CD کامل.',
    milestones: [
      { label: 'طراحی معماری جدید', done: true },
      { label: 'استقرار سرویس هویت', done: false },
      { label: 'پوشش مانیتورینگ', done: false },
    ],
  },
  {
    id: 'lg2',
    title: 'گسترش به بازار منطقه‌ای',
    horizon: '۶ تا ۹ ماه',
    desc: 'بومی‌سازی محصول و آماده‌سازی تیم پشتیبانی چندزبانه.',
    milestones: [
      { label: 'تحقیق بازار هدف', done: true },
      { label: 'ترجمه و بومی‌سازی UI', done: false },
      { label: 'آموزش تیم پشتیبانی', done: false },
    ],
  },
  {
    id: 'lg3',
    title: 'افزایش رضایت مشتریان اصلی',
    horizon: '۹ تا ۱۲ ماه',
    desc: 'کاهش تیکت‌های بحرانی و بهبود NPS با برنامه وفادسازی.',
    milestones: [
      { label: 'راه‌اندازی برنامه وفاداری', done: false },
      { label: 'پنل گزارشات مشتری', done: false },
      { label: 'بهبود SLA پشتیبانی', done: true },
    ],
  },
]

export default function LongGoalsPage() {
  return (
    <div className="goals" dir="rtl">
      <header className="goals__header">
        <div>
          <p className="eyebrow">چشم‌انداز بلند</p>
          <h1>اهداف بلندمدت</h1>
          <p className="light">مسیر ۳ تا ۱۲ ماه آینده را با مایلستون‌های شفاف و وضعیت دنبال کن.</p>
        </div>
        <button className="primary">تعریف هدف جدید</button>
      </header>

      <section className="goal-timeline">
        {goals.map((goal) => (
          <article key={goal.id} className="goal-timeline__card">
            <div className="goal-card__top">
              <h3>{goal.title}</h3>
              <span className="pill">افق: {goal.horizon}</span>
            </div>
            <p className="light">{goal.desc}</p>
            <div className="milestones">
              {goal.milestones.map((m, idx) => (
                <div key={idx} className="milestone">
                  <span className={`dot ${m.done ? 'dot--done' : 'dot--pending'}`} />
                  <span className={m.done ? 'light line-through' : 'light'}>{m.label}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="panel compact" style={{ marginTop: '10px' }}>
        <p className="eyebrow">فوکوس این فصل</p>
        <p className="light">۳ موضوع اصلی که باید حفظ شود</p>
        <div className="focus-tags">
          <span className="pill pill--focus">مقیاس‌پذیری</span>
          <span className="pill pill--meeting">بازار جدید</span>
          <span className="pill pill--errand">پشتیبانی برخط</span>
        </div>
      </section>
    </div>
  )
}
