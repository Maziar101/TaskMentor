import { BsPinAngleFill } from "react-icons/bs";
import EmojiText from "./EmojiText";
import { getLocale } from "../../../i18n/runtime";

export default function PinnedMessagesBar({ messages, onSelect }) {
  if (!messages.length) return null;

  return (
    <aside className="messenger-pinned-messages" aria-label="پیام‌های پین‌شده">
      <div className="messenger-pinned-messages__title">
        <BsPinAngleFill aria-hidden />
        <strong>پیام‌های پین‌شده</strong>
        <span>{messages.length.toLocaleString(getLocale())}</span>
      </div>
      <div className="messenger-pinned-messages__list">
        {messages.map((message) => {
          const preview = message.text || message.fileName || "پیام پین‌شده";
          return (
            <button
              key={message.id}
              type="button"
              onClick={() => onSelect(message.id)}
              title={preview}
              aria-label={`رفتن به پیام پین‌شده: ${preview}`}
            >
              <BsPinAngleFill aria-hidden />
              <span><EmojiText text={preview} /></span>
              <time>{message.time}</time>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
