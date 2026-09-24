import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowRight, FiSearch, FiX } from "react-icons/fi";
import { IoArrowForwardCircle } from "react-icons/io5";
import MessageBubble from "./MessageBubble";
import { getLocale } from "../../../i18n/runtime";

const formatMessageDate = (value) => new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" })
  .format(new Date(value));
const CLOSE_DELAY = 220;

export default function PinnedMessagesView({
  busy,
  messages,
  allMessages,
  onBack,
  onContextMenu,
  onMessageAction,
  onPreviewImage,
  onSelect,
  onTaskForwardResponse,
  showSender,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [unpinning, setUnpinning] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);
  const visibleMessages = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(getLocale());
    if (!normalized) return messages;
    return messages.filter((message) =>
      (message.text || message.fileName || "")
        .toLocaleLowerCase(getLocale())
        .includes(normalized));
  }, [messages, query]);

  useEffect(() => {
    if (!messages.length) onBack();
  }, [messages.length, onBack]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const requestClose = useCallback((afterClose = onBack) => {
    if (closing) return;
    setClosing(true);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(afterClose, reduceMotion ? 0 : CLOSE_DELAY);
  }, [closing, onBack]);

  const unpinAll = async () => {
    if (!window.confirm("پین همه پیام‌های این گفتگو برداشته شود؟")) return;
    setUnpinning(true);
    let allSucceeded = true;
    for (const message of messages) {
      if (!await onMessageAction(message.id, { pinned: false })) allSucceeded = false;
    }
    setUnpinning(false);
    if (allSucceeded) requestClose();
  };

  return (
    <section
      className={`messenger-pinned-view${closing ? " is-closing" : ""}`}
      aria-label="فهرست پیام‌های پین‌شده"
    >
      <header className="messenger-pinned-view__header">
        <button type="button" onClick={() => requestClose()} aria-label="بازگشت به گفتگو" title="بازگشت">
          <FiArrowRight />
        </button>
        <h2>{messages.length.toLocaleString(getLocale())} پیام پین‌شده</h2>
        <div className={`messenger-pinned-view__search${searchOpen ? " is-open" : ""}`}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در پیام‌های پین‌شده..."
            aria-label="جستجو در پیام‌های پین‌شده"
            tabIndex={searchOpen ? 0 : -1}
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen((current) => !current);
              if (searchOpen) setQuery("");
            }}
            aria-label={searchOpen ? "بستن جستجو" : "جستجو"}
            title={searchOpen ? "بستن جستجو" : "جستجو"}
          >
            {searchOpen ? <FiX /> : <FiSearch />}
          </button>
        </div>
      </header>

      <div className="messenger-pinned-view__messages">
        {visibleMessages.length ? visibleMessages.map((message, index) => (
          <article
            className={`messenger-pinned-view__message messenger-pinned-view__message--${message.side}`}
            key={message.id}
          >
            {(!visibleMessages[index - 1]
              || formatMessageDate(visibleMessages[index - 1].createdAt) !== formatMessageDate(message.createdAt)) && (
              <div className="messenger-chat__date"><span>{formatMessageDate(message.createdAt)}</span></div>
            )}
            <div className="messenger-pinned-view__message-row">
              <button
                type="button"
                onClick={() => requestClose(() => onSelect(message.id))}
                aria-label={`رفتن به پیام پین‌شده: ${message.text || message.fileName || "پیام"}`}
                title="نمایش در گفتگو"
              >
                <IoArrowForwardCircle />
              </button>
              <MessageBubble
                message={message}
                busy={busy}
                replyMessage={message.replyToId ? allMessages.find((item) => item.id === message.replyToId) : null}
                onContextMenu={onContextMenu}
                onPreviewImage={onPreviewImage}
                onTaskForwardResponse={onTaskForwardResponse}
                showSender={showSender}
              />
            </div>
          </article>
        )) : (
          <p className="messenger-pinned-view__empty">پیام پین‌شده‌ای پیدا نشد.</p>
        )}
      </div>

      <button
        className="messenger-pinned-view__unpin-all"
        type="button"
        disabled={busy || unpinning}
        onClick={unpinAll}
      >
        {unpinning ? "در حال برداشتن پین…" : `برداشتن پین همه ${messages.length.toLocaleString(getLocale())} پیام`}
      </button>
    </section>
  );
}
