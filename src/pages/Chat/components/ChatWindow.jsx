import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPaperclip,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import MessageInput from "./MessageInput";
import EmojiPickerButton from "./EmojiPickerButton";
import ChatAvatar from "./ChatAvatar";
import MessageBubble from "./MessageBubble";
import ChatHeaderMenu from "./ChatHeaderMenu";
import MessageContextMenu from "./MessageContextMenu";

export default function ChatWindow({
  conversation,
  saving,
  error,
  draft,
  messages,
  onAttach,
  onClearHistory,
  onDeleteConversation,
  onDraftChange,
  onMessageAction,
  onSend,
}) {
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageMenuSequence = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [messageMenu, setMessageMenu] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const filteredMessages = useMemo(() => {
    const query = messageSearch.trim().toLocaleLowerCase("fa-IR");
    if (!query) return messages;
    return messages.filter((message) =>
      message.type === "text" && message.text?.toLocaleLowerCase("fa-IR").includes(query));
  }, [messageSearch, messages]);

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    if (next.length > 10000) return;
    onDraftChange(next);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  useEffect(() => {
    const element = messagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [conversation.id, messages]);

  useEffect(() => {
    setSearchOpen(false);
    setMessageSearch("");
    setMessageMenu(null);
    setReplyTarget(null);
    setEditTarget(null);
  }, [conversation.id]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleComposerSend = async () => {
    if (editTarget) {
      const text = draft.trim();
      if (!text || saving) return;
      if (await onMessageAction(editTarget.id, { text })) {
        onDraftChange("");
        setEditTarget(null);
      }
      return;
    }
    if (await onSend(replyTarget ? { replyToId: replyTarget.id } : {})) setReplyTarget(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleComposerSend();
  };

  const openMessageMenu = (event, message) => {
    event.preventDefault();
    messageMenuSequence.current += 1;
    setMessageMenu({
      key: messageMenuSequence.current,
      message,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  return (
    <section className="messenger-chat" aria-label={`گفتگو با ${conversation.name}`}>
      <header className="messenger-chat__header">
        <div className="messenger-chat__identity">
          <ChatAvatar conversation={conversation} size="large" />
          <span>
            <strong>{conversation.name}</strong>
            <small className={conversation.online ? "is-online" : ""}>
              {conversation.id === "saved"
                ? "پیام‌های ذخیره‌شده"
                : conversation.online ? "آنلاین" : "آخرین بازدید اخیراً"}
            </small>
          </span>
        </div>
        <div className="messenger-chat__actions">
          <div className={`messenger-message-search${searchOpen ? " is-open" : ""}`}>
            <FiSearch aria-hidden />
            <input
              ref={searchInputRef}
              type="search"
              value={messageSearch}
              disabled={!searchOpen}
              tabIndex={searchOpen ? 0 : -1}
              onChange={(event) => setMessageSearch(event.target.value)}
              placeholder="جستجو در پیام‌ها..."
              aria-label="جستجو در پیام‌های این گفتگو"
            />
            {messageSearch && <span>{filteredMessages.length.toLocaleString("fa-IR")}</span>}
            <button type="button" tabIndex={searchOpen ? 0 : -1} onClick={() => { setMessageSearch(""); setSearchOpen(false); }} aria-label="بستن جستجو" title="بستن جستجو">
              <FiX />
            </button>
          </div>
          <IconButton
            label={searchOpen ? "بستن جستجو" : "جستجو در پیام‌ها"}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((value) => !value);
              if (searchOpen) setMessageSearch("");
            }}
          >
            <FiSearch />
          </IconButton>
          <ChatHeaderMenu
            conversation={conversation}
            busy={saving}
            onClearHistory={onClearHistory}
            onDeleteChat={onDeleteConversation}
          />
        </div>
      </header>

      <div className="messenger-chat__messages" ref={messagesRef} aria-live="polite">
        {error && <p role="alert" className="messenger-chat__error">{error}</p>}
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message, index) => (
            <MessageWithDate
              key={message.id}
              message={message}
              previous={filteredMessages[index - 1]}
              messages={messages}
              onContextMenu={openMessageMenu}
            />
          ))
        ) : messageSearch.trim() ? (
          <div className="messenger-chat__welcome messenger-chat__search-empty" role="status">
            <FiSearch />
            <strong>پیامی پیدا نشد</strong>
            <span>عبارت دیگری را جستجو کنید.</span>
          </div>
        ) : (
          <div className="messenger-chat__welcome">
            <ChatAvatar conversation={conversation} size="large" />
            <strong>{conversation.name}</strong>
            <span>{conversation.id === "saved" ? "پیام‌های شخصی خود را اینجا ذخیره کنید" : "شروع یک گفتگوی تازه"}</span>
          </div>
        )}
      </div>

      <form className="messenger-composer" onSubmit={handleSubmit}>
        <div className="messenger-composer__input">
          {(replyTarget || editTarget) && (
            <div className="messenger-composer__reference">
              <span>
                <strong>{editTarget ? "ویرایش پیام" : "پاسخ به پیام"}</strong>
                <small>{(editTarget || replyTarget).text || (editTarget || replyTarget).fileName}</small>
              </span>
              <button type="button" onClick={() => { setReplyTarget(null); setEditTarget(null); if (editTarget) onDraftChange(""); }} aria-label="لغو"><FiX /></button>
            </div>
          )}
          <EmojiPickerButton key={conversation.id} disabled={saving} onPick={insertEmoji} />
          <MessageInput
            ref={inputRef}
            disabled={saving}
            value={draft}
            onChange={onDraftChange}
            onSend={handleComposerSend}
          />
          <label className="messenger-icon-button" aria-label="پیوست فایل" title="پیوست فایل">
            <FiPaperclip />
            <input type="file" onChange={onAttach} disabled={saving} />
          </label>
        </div>
        <button className="messenger-send" type="submit" disabled={saving || !draft.trim()} aria-label={saving ? "در حال ذخیره پیام" : "ارسال پیام"}>
          <FiSend />
        </button>
      </form>
      {messageMenu && (
        <MessageContextMenu
          key={messageMenu.key}
          message={messageMenu.message}
          position={messageMenu.position}
          busy={saving}
          onAction={onMessageAction}
          onClose={() => setMessageMenu(null)}
          onReply={(message) => { setEditTarget(null); setReplyTarget(message); inputRef.current?.focus(); }}
          onEdit={(message) => { setReplyTarget(null); setEditTarget(message); onDraftChange(message.text); requestAnimationFrame(() => inputRef.current?.focus()); }}
        />
      )}
    </section>
  );
}

function IconButton({ children, label, ...props }) {
  return (
    <button className="messenger-icon-button" type="button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

function MessageWithDate({ message, previous, messages, onContextMenu }) {
  const formatDate = (value) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(value));
  const date = formatDate(message.createdAt);
  return (
    <>
      {(!previous || formatDate(previous.createdAt) !== date) && (
        <div className="messenger-chat__date"><span>{date}</span></div>
      )}
      <MessageBubble
        message={message}
        replyMessage={message.replyToId ? messages.find((item) => item.id === message.replyToId) : null}
        onContextMenu={onContextMenu}
      />
    </>
  );
}
