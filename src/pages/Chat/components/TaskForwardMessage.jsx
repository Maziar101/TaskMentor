import { FiCalendar, FiCheck, FiClock, FiX } from "react-icons/fi";
import { TiArrowForwardOutline } from "react-icons/ti";
import { getLanguage, getLocale } from "../../../i18n/runtime";

const dateFormatter = new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium" });
const numberFormatter = new Intl.NumberFormat(getLocale());

export default function TaskForwardMessage({ message, busy, onRespond }) {
  const request = message.taskForward;
  if (!request) return <p>{message.text}</p>;

  const status = getStatusText(message);
  return (
    <div className="messenger-task-forward">
      <span className="messenger-task-forward__eyebrow">
        <TiArrowForwardOutline aria-hidden />
        درخواست انجام تسک
      </span>
      <strong>{request.title}</strong>
      <span className="messenger-task-forward__details">
        <span><FiCalendar aria-hidden />{formatDay(request.day)}</span>
        <span><FiClock aria-hidden />{formatHour(request.hour)} · {numberFormatter.format(request.duration)} ساعت</span>
      </span>
      <p>{getLanguage() === "en" ? getRequestPrompt(request) : message.text}</p>
      {request.canRespond ? (
        <span className="messenger-task-forward__actions">
          <button type="button" disabled={busy} onClick={() => onRespond(request.id, "accept")}>
            <FiCheck aria-hidden />تأیید
          </button>
          <button type="button" disabled={busy} onClick={() => onRespond(request.id, "reject")}>
            <FiX aria-hidden />رد کردن
          </button>
        </span>
      ) : (
        <span className={`messenger-task-forward__status is-${request.status}`}>{status}</span>
      )}
    </div>
  );
}

function getStatusText(message) {
  const request = message.taskForward;
  if (request.status === "accepted") {
    return message.side === "mine"
      ? `${request.recipientName} این تسک را پذیرفت.`
      : "این تسک به برنامه‌ریز شما اضافه شد.";
  }
  if (request.status === "rejected") {
    return message.side === "mine"
      ? `${request.recipientName} این تسک را رد کرد.`
      : "شما این تسک را رد کردید.";
  }
  return message.side === "mine"
    ? `در انتظار پاسخ ${request.recipientName}`
    : `ارسال‌شده از طرف ${request.senderName}`;
}

function formatDay(day) {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? day : dateFormatter.format(date);
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getRequestPrompt(request) {
  return `Would you like to work on “${request.title}” at ${formatHour(request.hour)}?`;
}
