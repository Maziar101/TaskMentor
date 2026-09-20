import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { getLanguage, getLocale } from "../../../i18n/runtime";
import {
  JALALI_MONTHS,
  buildJalaliMonthDays,
  buildYearOptions,
  dateKeyFromGregorian,
  dateKeyFromJalali,
  formatGregorianSpanForJalaliMonth,
  formatJalaliMonthName,
  toJalaliParts,
} from "../utils";

const GREGORIAN_MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, month, 1)),
  ),
);

function getGregorianParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getCalendarView(date, isEnglish) {
  if (isEnglish) {
    const { year, month } = getGregorianParts(date);
    return { year, month };
  }

  const { jy, jm } = toJalaliParts(date);
  return { year: jy, month: jm };
}

function buildGregorianMonthDays(year, month) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = Array(firstWeekday).fill(null);

  for (let day = 1; day <= dayCount; day += 1) days.push(day);
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

export default function PlannerCalendar({ activeDay, now, onSelectDay }) {
  const isEnglish = getLanguage() === "en";
  const activeDate = useMemo(
    () => new Date(`${activeDay}T00:00:00Z`),
    [activeDay],
  );
  const [view, setView] = useState(() => getCalendarView(activeDate, isEnglish));
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    setView(getCalendarView(activeDate, isEnglish));
  }, [activeDate, isEnglish]);

  const activeParts = isEnglish
    ? getGregorianParts(activeDate)
    : (() => {
        const { jy, jm, jd } = toJalaliParts(activeDate);
        return { year: jy, month: jm, day: jd };
      })();
  const todayParts = isEnglish
    ? getGregorianParts(now)
    : (() => {
        const { jy, jm, jd } = toJalaliParts(now);
        return { year: jy, month: jm, day: jd };
      })();
  const days = useMemo(
    () =>
      isEnglish
        ? buildGregorianMonthDays(view.year, view.month)
        : buildJalaliMonthDays(view.year, view.month),
    [isEnglish, view],
  );
  const monthOptions = isEnglish ? GREGORIAN_MONTHS : JALALI_MONTHS;
  const monthName = isEnglish
    ? monthOptions[view.month - 1]
    : formatJalaliMonthName({ jy: view.year, jm: view.month });
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(getLocale(), { useGrouping: false }),
    [],
  );
  const weekdays = isEnglish
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  function shiftMonth(delta) {
    setView((current) => {
      const anchor = new Date(Date.UTC(current.year, current.month - 1 + delta, 1));
      if (isEnglish) return getGregorianParts(anchor);

      let year = current.year;
      let month = current.month + delta;
      while (month > 12) {
        month -= 12;
        year += 1;
      }
      while (month < 1) {
        month += 12;
        year -= 1;
      }
      return { year, month };
    });
  }

  function selectDay(day) {
    if (!day) return;
    const key = isEnglish
      ? dateKeyFromGregorian(view.year, view.month, day)
      : dateKeyFromJalali(view.year, view.month, day);
    onSelectDay(key);
  }

  const PreviousIcon = isEnglish ? FiChevronLeft : FiChevronRight;
  const NextIcon = isEnglish ? FiChevronRight : FiChevronLeft;

  return (
    <>
      <div className="panel calendar-strip" aria-label="انتخاب زمان">
        <div className="calendar-strip__head">
          <button
            className="calendar-strip__btn"
            type="button"
            aria-label="ماه قبل"
            onClick={() => shiftMonth(-1)}
          >
            <PreviousIcon />
          </button>
          <div className="calendar-strip__title">
            <button
              className="calendar-strip__title-btn"
              type="button"
              onClick={() => setPicker("month")}
            >
              <span>{monthName}</span>
              <span className="calendar-strip__caret">▾</span>
            </button>
            <button
              className="calendar-strip__year-btn"
              type="button"
              onClick={() => setPicker("year")}
            >
              {numberFormatter.format(view.year)}
            </button>
            {!isEnglish && (
              <p className="calendar-strip__sub">
                {formatGregorianSpanForJalaliMonth(view.year, view.month)}
              </p>
            )}
          </div>
          <button
            className="calendar-strip__btn"
            type="button"
            aria-label="ماه بعد"
            onClick={() => shiftMonth(1)}
          >
            <NextIcon />
          </button>
        </div>
        <div className="calendar-strip__weekdays">
          {weekdays.map((label, index) => (
            <span key={`${label}-${index}`} className="calendar-strip__weekday">
              {label}
            </span>
          ))}
        </div>
        <div className="calendar-strip__days">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <span
                  key={`empty-${index}`}
                  className="calendar-strip__day calendar-strip__day--ghost"
                  aria-hidden
                />
              );
            }
            const isSelected =
              view.year === activeParts.year &&
              view.month === activeParts.month &&
              day === activeParts.day;
            const isToday =
              view.year === todayParts.year &&
              view.month === todayParts.month &&
              day === todayParts.day;
            return (
              <button
                key={day}
                type="button"
                className={[
                  "calendar-strip__day",
                  isSelected && "calendar-strip__day--active",
                  isToday && "calendar-strip__day--today",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectDay(day)}
              >
                <span>{numberFormatter.format(day)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {picker && (
        <div className="modal">
          <div
            className="modal__backdrop"
            onClick={() => setPicker(null)}
            aria-hidden
          />
          <div
            className="modal__card calendar-modal__card"
            role="dialog"
            aria-modal="true"
          >
            <div className="calendar-modal__header">
              <div className="calendar-modal__title">
                <span className="calendar-picker__icon" aria-hidden>
                  <FiCalendar />
                </span>
                <div>
                  <p className="eyebrow">
                    انتخاب {picker === "month" ? "ماه" : "سال"}
                  </p>
                  <p className="light small">
                    {picker === "month"
                      ? "یکی از ماه‌ها را انتخاب کن"
                      : "یک سال از لیست انتخاب کن"}
                  </p>
                </div>
              </div>
              <button
                className="calendar-modal__close"
                type="button"
                aria-label="بستن"
                onClick={() => setPicker(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="calendar-modal__body">
              <div className="calendar-modal__section">
                <div
                  className={[
                    "calendar-modal__grid",
                    picker === "year" && "calendar-modal__grid--years",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {(picker === "month"
                    ? monthOptions
                    : buildYearOptions(view.year)
                  ).map((option, index) => {
                    const value = picker === "month" ? index + 1 : option;
                    const active =
                      picker === "month"
                        ? value === view.month
                        : value === view.year;
                    return (
                      <button
                        key={option}
                        className={[
                          "calendar-modal__option",
                          active && "calendar-modal__option--active",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        type="button"
                        onClick={() => {
                          setView((current) => ({
                            ...current,
                            [picker]: value,
                          }));
                          setPicker(null);
                        }}
                      >
                        {picker === "year"
                          ? numberFormatter.format(option)
                          : option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
