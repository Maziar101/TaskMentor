import { useCallback, useRef, useState } from "react";
import ConversationContextMenu from "./ConversationContextMenu";
import { FiMessageCircle, FiPlus, FiSearch, FiUsers } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { CHAT_FILTERS } from "../data";
import EmojiText from "./EmojiText";
import ChatAvatar from "./ChatAvatar";
import AddContactDialog from "./AddContactDialog";

export default function ConversationList({
  saving,
  onConversationAction,
  activeFilter,
  contacts,
  conversations,
  onAddContact,
  onContactSelect,
  onFilterChange,
  onNewConversation,
  onSearchChange,
  onSelect,
  search,
  selectedId,
}) {
  const [context, setContext] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [sidebarElement, setSidebarElement] = useState(null);
  const triggerRef = useRef(null);
  const visibleContacts = contacts.filter((contact) => {
    const query = contactSearch.trim().toLocaleLowerCase("fa");
    return !query || contact.name.toLocaleLowerCase("fa").includes(query) || contact.phone.includes(query);
  });
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
    <aside
      ref={setSidebarElement}
      className="messenger-conversations"
      aria-label={showContacts ? "فهرست مخاطبین" : "فهرست گفتگوها"}
    >
      <div
        key={showContacts ? "contacts" : "conversations"}
        className={showContacts
          ? "messenger-conversations__view messenger-conversations__view--contacts"
          : "messenger-conversations__view messenger-conversations__view--chats"}
      >
        <header className="messenger-conversations__header">
          <h1>{showContacts ? "مخاطبین" : "گفتگوها"}</h1>
          {!showContacts && (
            <button
              className="messenger-new-button"
              type="button"
              onClick={onNewConversation}
              aria-label="گفتگوی جدید"
              title="گفتگوی جدید"
            >
              <FiPlus />
            </button>
          )}
        </header>

        <label className="messenger-search">
          <FiSearch aria-hidden />
          <input
            value={showContacts ? contactSearch : search}
            onChange={(event) => showContacts
              ? setContactSearch(event.target.value)
              : onSearchChange(event.target.value)}
            placeholder={showContacts ? "جستجو در مخاطبین..." : "جستجو در گفتگوها..."}
            aria-label={showContacts ? "جستجو در مخاطبین" : "جستجو در گفتگوها"}
          />
        </label>

        {!showContacts && (
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
        )}

        <div className="messenger-conversations__list">
        {showContacts ? (
          visibleContacts.length === 0 ? (
            <p className="messenger-conversations__empty">مخاطبی پیدا نشد.</p>
          ) : visibleContacts.map((contact) => (
            <article key={contact.id} className="messenger-conversation">
              <button
                className="messenger-conversation__select"
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (await onContactSelect(contact.id)) setShowContacts(false);
                }}
                aria-label={`انتخاب ${contact.name}`}
              >
                <ChatAvatar conversation={contact} />
                <span className="messenger-conversation__content">
                  <span className="messenger-conversation__title-row">
                    <strong>{contact.name}</strong>
                  </span>
                  <span className="messenger-conversation__preview-row">
                    <span>{contact.phone}</span>
                  </span>
                </span>
              </button>
            </article>
          ))
        ) : conversations.length === 0 ? (
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
      </div>
      {showContacts && (
        <button
          className="messenger-add-contact-button"
          type="button"
          onClick={() => setShowAddContact(true)}
          aria-label="افزودن مخاطب جدید"
          title="افزودن مخاطب جدید"
        >
          <FiPlus />
        </button>
      )}
      <button
        className={showContacts
          ? "messenger-contacts-button is-active"
          : "messenger-contacts-button"}
        type="button"
        onClick={() => setShowContacts((current) => !current)}
        aria-label={showContacts ? "بازگشت به گفتگوها" : "نمایش مخاطبین"}
        title={showContacts ? "گفتگوها" : "مخاطبین"}
      >
        {showContacts ? <FiMessageCircle /> : <FiUsers />}
      </button>
      <AddContactDialog
        busy={saving}
        container={sidebarElement}
        open={showAddContact}
        onAdd={onAddContact}
        onClose={() => setShowAddContact(false)}
      />
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
