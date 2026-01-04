import { useState } from 'react'

type ThemeOption = {
  id: string
  label: string
  preview: string
}

const themeOptions: ThemeOption[] = [
  {
    id: 'theme-1',
    label: 'تم ۱',
    preview: 'linear-gradient(120deg, rgba(247, 208, 70, 0.75), rgba(161, 107, 255, 0.65))',
  },
  {
    id: 'theme-2',
    label: 'تم ۲',
    preview: 'linear-gradient(120deg, rgba(101, 236, 204, 0.75), rgba(111, 75, 255, 0.65))',
  },
  {
    id: 'theme-3',
    label: 'تم ۳',
    preview: 'linear-gradient(120deg, rgba(255, 154, 167, 0.75), rgba(127, 240, 216, 0.65))',
  },
]

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState(themeOptions[0]?.id ?? '')

  return (
    <div className="settings" dir="rtl">
      <header className="settings__header">
        <div>
          <p className="settings__eyebrow">تنظیمات</p>
          <h1>تنظیمات</h1>
          <p className="light">مدیریت ظاهر و رنگ‌های پروژه.</p>
        </div>
      </header>

      <section className="panel settings__panel">
        <div className="settings-tabs">
          <div className="settings-tabs__list">
            <button type="button" className="settings-tab settings-tab--active">
              تغییر تم
            </button>
          </div>
        </div>

        <div className="settings__content">
          <div>
            <h3>رنگ پروژه</h3>
            <p className="light small">یکی از پالت‌های رنگی را انتخاب کنید.</p>
          </div>
          <div className="settings__palette">
            {themeOptions.map((option) => {
              const isActive = option.id === selectedTheme
              return (
                <button
                  key={option.id}
                  type="button"
                  className={['settings__theme-card', isActive && 'settings__theme-card--active']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedTheme(option.id)}
                  aria-pressed={isActive}
                >
                  <span className="settings__theme-preview" style={{ background: option.preview }} aria-hidden />
                  <span className="settings__theme-label">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
