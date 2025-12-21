import { useEffect, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { FiCalendar } from "react-icons/fi";

type CalendarProps = {
  place?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  setFieldValue?: (value: string | null) => void;
  setTimestamps?: (value: number | null) => void;
};

export default function Calender({
  place,
  value,
  onChange,
  setFieldValue,
  setTimestamps,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    value ?? null
  );

  useEffect(() => {
    setSelectedDate(value ?? null);
  }, [value]);

  const handleDateChange = (date: DateObject | null) => {
    if (!date) {
      setSelectedDate(null);
      onChange?.("");
      setFieldValue?.(null);
      setTimestamps?.(null);
      return;
    }

    const formatted = date.format("YYYY-MM-DD");
    const ts = date.toDate().setHours(0, 0, 0, 0);
    setSelectedDate(formatted);
    onChange?.(formatted);
    setFieldValue?.(formatted);
    setTimestamps?.(ts);
  };

  const placeholder = place || "انتخاب تاریخ";

  return (
    <div className="date-picker">
      <DatePicker
        value={selectedDate}
        onChange={handleDateChange}
        calendar={persian}
        locale={persian_fa}
        format="YYYY-MM-DD"
        calendarPosition="bottom-center"
        editable={false}
        containerClassName="date-picker__container"
        className="date-picker__picker"
        portal={typeof document !== "undefined"}
        render={(val, openCalendar) => (
          <button type="button" className="date-field" onClick={openCalendar}>
            <span
              className={val ? "date-field__value" : "date-field__placeholder"}
            >
              {val || placeholder}
            </span>
            <FiCalendar aria-hidden />
          </button>
        )}
      />
    </div>
  );
}
