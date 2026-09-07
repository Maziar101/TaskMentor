import { useCallback, useRef, useState } from "react";
import ConversationContextMenu from "./ConversationContextMenu";
import { FiPlus, FiSearch } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { CHAT_FILTERS } from "../data";
import EmojiText from "./EmojiText";
import ChatAvatar from "./ChatAvatar";

export default function ConversationList({
  saving,
  onConversationAction,
  activeFilter,
  conversations,
  onFilterChange,
  onNewConversation,
  onSearchChange,
  onSelect,
  search,
  selectedId,
}) {
  const [context, setContext] = useState(null);
  const triggerRef = useRef(null);
  const closeMenu = useCallback(() => {
    setContext(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  const openMenu = (event, conversation) => {
    event.preventDefault();
    const target = event.currentTarget.querySelector("button");
    triggerRef.current = target;
    const rect = target.getBoundingClientRect();
    setContext({ conversation, position: {
      x: event.clientX || rect.left + 20,
      y: event.clientY || rect.bottom,
    } });
  };
  return (
    <aside className="messenger-conversations" aria-label="فهرست گفتگوها">
      <header className="messenger-conversations__header">
        <h1>گفتگوها</h1>
        <button
          className="messenger-new-button"
          type="button"
          onClick={onNewConversation}
          aria-label="گفتگوی جدید"
          title="گفتگوی جدید"
        >
          <FiPlus />
        </button>
      </header>

      <label className="messenger-search">
        <FiSearch aria-hidden />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="جستجو در گفتگوها..."
          aria-label="جستجو در گفتگوها"
        />
      </label>

      <div className="messenger-filters" role="tablist" aria-label="فیلتر گفتگوها">
        {CHAT_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.id}
            className={activeFilter === filter.id ? "is-active" : ""}
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="messenger-conversations__list">
        {conversations.length === 0 ? (
          <p className="messenger-conversations__empty">گفتگویی پیدا نشد.</p>
        ) : (
          conversations.map((conversation) => (
            <article
              key={conversation.id}
              onContextMenu={(event) => openMenu(event, conversation)}
              onKeyDown={(event) => {
                if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) openMenu(event, conversation);
              }}
              className={[
                "messenger-conversation",
                selectedId === conversation.id && "is-active",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                className="messenger-conversation__select"
                type="button"
                onClick={() => onSelect(conversation.id)}
                aria-current={selectedId === conversation.id ? "true" : undefined}
              >
                <ChatAvatar conversation={conversation} />
                <span className="messenger-conversation__content">
                  <span className="messenger-conversation__title-row">
                    <strong>{conversation.name}</strong>
                    <time>{conversation.time}</time>
                  </span>
                  <span className="messenger-conversation__preview-row">
                    <span><EmojiText text={conversation.preview} /></span>
                    {conversation.unread > 0 && (
                      <b aria-label={`${conversation.unread} پیام خوانده‌نشده`}>
                        {conversation.unread.toLocaleString("fa-IR")}
                      </b>
                    )}
                  </span>
                </span>
              </button>
              {conversation.pinned && (
                <BsPinAngleFill
                  className="messenger-conversation__pin"
                  aria-label="گفتگوی پین‌شده"
                  title="گفتگوی پین‌شده"
                />
              )}
            </article>
          ))
        )}
      </div>
      {context && (
        <ConversationContextMenu
          key={context.conversation.id}
          conversation={context.conversation}
          position={context.position}
          busy={saving}
          onAction={onConversationAction}
          onClose={closeMenu}
        />
      )}
    </aside>
  );
}
