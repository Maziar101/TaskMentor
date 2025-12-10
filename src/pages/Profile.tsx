const highlights = [
  { label: 'آخرین موفقیت', value: 'تحویل MVP به مشتری کلیدی', tone: 'pill--solid' },
  { label: 'حوزه تمرکز', value: 'محصول و فرآیند', tone: 'pill--focus' },
  { label: 'ریتم هفتگی', value: '۱ روز استراتژی، ۳ روز تحویل، ۱ روز یادگیری', tone: 'pill--meeting' },
]

const habits = [
  { title: 'بلوک عمیق', desc: '۹ تا ۱۱ صبح هر روز، بدون جلسه' },
  { title: 'گزارش سریع', desc: 'جمع‌بندی ۱۵ دقیقه‌ای در پایان روز' },
  { title: 'بررسی ریسک', desc: 'دوشنبه‌ها مرور ریسک و وابستگی‌ها' },
]

const availability = [
  { day: 'یکشنبه', slot: '۱۴-۱۶', type: 'هماهنگی تیم' },
  { day: 'سه‌شنبه', slot: '۱۰-۱۲', type: '۱:۱ و کوچینگ' },
  { day: 'چهارشنبه', slot: '۱۵-۱۷', type: 'همکاری بین تیمی' },
]

const preferences = [
  { label: 'کانال ارتباطی', value: 'اسلک و تماس ۱۵ دقیقه‌ای' },
  { label: 'سبک تصمیم‌گیری', value: 'داده‌محور + تایید سریع ذینفع' },
  { label: 'نحوه پیگیری', value: 'آپدیت کوتاه سه‌شنبه و پنجشنبه' },
]

export default function ProfilePage() {
  return (
    <div className="profile" dir="rtl">
      <section className="panel profile__hero">
        <div className="profile__identity">
          <div className="avatar">MS</div>
          <div>
            <h1>مظیار سلطانی</h1>
            <p className="light">مدیر محصول | خلق تجربه منسجم برای تیم و مشتری</p>
            <div className="profile__tags">
              {highlights.map((item) => (
                <span key={item.label} className={`pill ${item.tone}`}>
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="profile__stats">
          <div className="stat">
            <p className="eyebrow">اهداف فعال</p>
            <p className="stat__value">۱۲</p>
            <p className="small light">۴ کوتاه‌مدت، ۸ بلندمدت</p>
          </div>
          <div className="stat">
            <p className="eyebrow">پیشرفت</p>
            <div className="meter">
              <span style={{ width: '68%' }} />
            </div>
            <p className="small light">۶۸٪ در مسیر برنامه</p>
          </div>
          <div className="stat">
            <p className="eyebrow">سطح دسترسی</p>
            <span className="pill pill--solid">Admin</span>
          </div>
        </div>
      </section>

      <section className="profile__grid">
        <div className="panel profile__card">
          <div className="panel__header">
            <h3>روال و عادت‌ها</h3>
            <span className="pill pill--focus">ثبات</span>
          </div>
          <ul className="list">
            {habits.map((habit) => (
              <li key={habit.title}>
                <strong>{habit.title}</strong>
                <p className="light small">{habit.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel profile__card">
          <div className="panel__header">
            <h3>تقویم در دسترس</h3>
            <span className="pill pill--meeting">هماهنگی</span>
          </div>
          <div className="availability">
            {availability.map((slot) => (
              <div key={slot.day} className="availability__item">
                <div>
                  <p className="eyebrow">{slot.day}</p>
                  <p>{slot.slot}</p>
                </div>
                <span className="pill">{slot.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel profile__card">
          <div className="panel__header">
            <h3>نحوه همکاری</h3>
            <span className="pill pill--solid">انتظارات</span>
          </div>
          <div className="preferences">
            {preferences.map((pref) => (
              <div key={pref.label} className="preferences__row">
                <p className="eyebrow">{pref.label}</p>
                <p className="light">{pref.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel profile__card">
          <div className="panel__header">
            <h3>بازخورد سریع</h3>
            <span className="pill pill--errand">پیام کوتاه</span>
          </div>
          <div className="feedback">
            <label className="field field--wide">
              <span>پیامی برای اعضای تیم</span>
              <textarea placeholder="مثلا: تمرکز این هفته روی افزایش سرعت تحویل فیچر جدید است." />
            </label>
            <div className="form-actions">
              <button className="primary" type="button">
                ذخیره یادداشت
              </button>
              <button className="ghost" type="button">
                اشتراک در اسلک
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
