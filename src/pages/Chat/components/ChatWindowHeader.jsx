import { FiSearch, FiX } from "react-icons/fi";
import ChatAvatar from "./ChatAvatar";
import ChatHeaderMenu from "./ChatHeaderMenu";
import { getLocale } from "../../../i18n/runtime";

export default function ChatWindowHeader({
  conversation,
  filteredCount,
  messageSearch,
  onClearHistory,
  onCloseSearch,
  onDeleteConversation,
  onMessageSearchChange,
  onOpenProfile,
  onToggleSearch,
  searchInputRef,
  searchOpen,
  saving,
}) {
  const profileDisabled = conversation.id === "saved" || conversation.isGroup;

  return (
    <header className="messenger-chat__header">
      <button
        type="button"
        className="messenger-chat__identity"
        disabled={profileDisabled}
        onClick={onOpenProfile}
        aria-label={profileDisabled ? undefined : `نمایش پروفایل ${conversation.name}`}
        aria-haspopup={profileDisabled ? undefined : "dialog"}
      >
        <ChatAvatar conversation={conversation} size="large" />
        <span>
          <strong>{conversation.name}</strong>
          <small className={conversation.online ? "is-online" : ""}>
            {conversation.id === "saved"
              ? "پیام‌های ذخیره‌شده"
              : conversation.isGroup
                ? `${conversation.memberCount.toLocaleString(getLocale())} عضو`
                : conversation.online ? "آنلاین" : "آخرین بازدید اخیراً"}
          </small>
        </span>
      </button>
      <div className="messenger-chat__actions">
        <div className={`messenger-message-search${searchOpen ? " is-open" : ""}`}>
          <FiSearch aria-hidden />
          <input
            ref={searchInputRef}
            type="search"
            value={messageSearch}
            disabled={!searchOpen}
            tabIndex={searchOpen ? 0 : -1}
            onChange={(event) => onMessageSearchChange(event.target.value)}
            placeholder="جستجو در پیام‌ها..."
            aria-label="جستجو در پیام‌های این گفتگو"
          />
          {messageSearch && <span>{filteredCount.toLocaleString(getLocale())}</span>}
          <button type="button" tabIndex={searchOpen ? 0 : -1} onClick={onCloseSearch} aria-label="بستن جستجو" title="بستن جستجو">
            <FiX />
          </button>
        </div>
        <button
          className="messenger-icon-button"
          type="button"
          aria-label={searchOpen ? "بستن جستجو" : "جستجو در پیام‌ها"}
          title={searchOpen ? "بستن جستجو" : "جستجو در پیام‌ها"}
          aria-expanded={searchOpen}
          onClick={onToggleSearch}
        >
          <FiSearch />
        </button>
        <ChatHeaderMenu
          conversation={conversation}
          busy={saving}
          onClearHistory={onClearHistory}
          onDeleteChat={onDeleteConversation}
        />
      </div>
    </header>
  );
}
