import { useState } from "react";
import { IoMenu } from "react-icons/io5";
import EmojiText from "./EmojiText";
import { getLocale } from "../../../i18n/runtime";

export default function PinnedMessagesBar({ messages, onOpenList, onSelect }) {
  const messagesKey = messages.map((message) => message.id).join(":");
  const [cursor, setCursor] = useState(() => ({
    key: messagesKey,
    index: Math.max(0, messages.length - 1),
  }));

  if (!messages.length) return null;
  const currentIndex = cursor.key === messagesKey
    ? Math.min(cursor.index, messages.length - 1)
    : messages.length - 1;
  const message = messages[currentIndex];
  const preview = message.text || message.fileName || "پیام پین‌شده";

  const selectCurrentMessage = () => {
    onSelect(message.id);
    setCursor({
      key: messagesKey,
      index: Math.max(0, currentIndex - 1),
    });
  };

  return (
    <aside className="messenger-pinned-messages" aria-label="پیام‌های پین‌شده">
      <button
        className="messenger-pinned-messages__preview"
        type="button"
        onClick={selectCurrentMessage}
        title={preview}
        aria-label={`رفتن به پیام پین‌شده: ${preview}`}
      >
        <span className="messenger-pinned-messages__rail" aria-hidden />
        <span className="messenger-pinned-messages__copy" aria-live="polite">
          <strong>
            {messages.length === 1
              ? "پیام پین‌شده"
              : `${messages.length.toLocaleString(getLocale())} پیام پین‌شده`}
          </strong>
          <small><EmojiText text={preview} /></small>
        </span>
      </button>
      <button
        className="messenger-pinned-messages__open"
        type="button"
        onClick={onOpenList}
        aria-label="نمایش همه پیام‌های پین‌شده"
        title="همه پیام‌های پین‌شده"
      >
        <IoMenu aria-hidden />
      </button>
    </aside>
  );
}
