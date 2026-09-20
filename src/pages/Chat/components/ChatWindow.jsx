import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  FiPaperclip,
  FiSearch,
  FiSend,
  FiSlash,
  FiX,
} from "react-icons/fi";
import MessageInput from "./MessageInput";
import EmojiPickerButton from "./EmojiPickerButton";
import ChatAvatar from "./ChatAvatar";
import ChatHeaderMenu from "./ChatHeaderMenu";
import MessageContextMenu from "./MessageContextMenu";
import ImagePreviewModal from "./ImagePreviewModal";
import PinnedMessagesBar from "./PinnedMessagesBar";
import ContactProfileDialog from "./ContactProfileDialog";
import MessageWithDate from "./MessageWithDate";
import useChatWindowState from "../hooks/useChatWindowState";
import { getLocale } from "../../../i18n/runtime";

export default function ChatWindow({
  conversation,
  saving,
  error,
  draft,
  messages,
  onAttach,
  onBlockUser,
  onClearHistory,
  onDeleteConversation,
  onDraftChange,
  onMessageAction,
  onTaskForwardResponse,
  onSend,
}) {
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageMenuSequence = useRef(0);
  const highlightTimer = useRef(null);
  const shouldStickToBottom = useRef(true);
  const previousConversationId = useRef(null);
  const previousMessagesKey = useRef("");
  const { state, update } = useChatWindowState();
  const {
    searchOpen,
    messageSearch,
    messageMenu,
    replyTarget,
    editTarget,
    previewImage,
    pinnedJump,
    profileOpen,
  } = state;
  const closeImagePreview = useCallback(() => update("previewImage", null), [update]);

  const filteredMessages = useMemo(() => {
    const query = messageSearch.trim().toLocaleLowerCase(getLocale());
    if (!query) return messages;
    return messages.filter((message) =>
      message.text?.toLocaleLowerCase(getLocale()).includes(query));
  }, [messageSearch, messages]);
  const pinnedMessages = useMemo(
    () => messages.filter((message) => message.pinned),
    [messages],
  );

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

  useLayoutEffect(() => {
    const element = messagesRef.current;
    if (!element) return;
    const messagesKey = `${messages.length}:${messages.at(-1)?.id ?? ""}`;
    const conversationChanged = previousConversationId.current !== conversation.id;
    const messagesChanged = previousMessagesKey.current !== messagesKey;
    if (conversationChanged || (messagesChanged && shouldStickToBottom.current)) {
      element.scrollTop = element.scrollHeight;
      shouldStickToBottom.current = true;
    }
    previousConversationId.current = conversation.id;
    previousMessagesKey.current = messagesKey;
  }, [conversation.id, messages]);

  useLayoutEffect(() => {
    const messageId = pinnedJump?.id;
    if (!messageId) return;
    const container = messagesRef.current;
    const target = container?.querySelector(`[data-message-id="${messageId}"]`);
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const centeredTop = container.scrollTop
      + targetRect.top
      - containerRect.top
      - (container.clientHeight - targetRect.height) / 2;
    container.classList.add("is-instant-scroll");
    container.scrollTop = Math.max(0, centeredTop);
    requestAnimationFrame(() => container.classList.remove("is-instant-scroll"));
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => update("pinnedJump", null), 1800);
  }, [filteredMessages, pinnedJump, update]);

  useEffect(() => {
    update(
      ["searchOpen", "messageSearch", "messageMenu", "replyTarget", "editTarget", "previewImage", "pinnedJump", "profileOpen"],
      [false, "", null, null, null, null, null, false],
    );
  }, [conversation.id, update]);

  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleComposerSend = async () => {
    if (editTarget) {
      const text = draft.trim();
      if (!text || saving) return;
      if (await onMessageAction(editTarget.id, { text })) {
        onDraftChange("");
        update("editTarget", null);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      return;
    }
    if (await onSend(replyTarget ? { replyToId: replyTarget.id } : {})) {
      update("replyTarget", null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleComposerSend();
  };

  const openMessageMenu = (event, message) => {
    event.preventDefault();
    messageMenuSequence.current += 1;
    update("messageMenu", {
      key: messageMenuSequence.current,
      message,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const jumpToPinnedMessage = (messageId) => {
    update(
      ["searchOpen", "messageSearch", "pinnedJump"],
      [false, "", { id: messageId, sequence: performance.now() }],
    );
  };

  return (
    <section
      className={`messenger-chat${pinnedMessages.length ? " has-pinned-messages" : ""}`}
      aria-label={`گفتگو با ${conversation.name}`}
    >
      <header className="messenger-chat__header">
        <button
          type="button"
          className="messenger-chat__identity"
          disabled={conversation.id === "saved" || conversation.isGroup}
          onClick={() => update("profileOpen", true)}
          aria-label={conversation.id === "saved" || conversation.isGroup
            ? undefined
            : `نمایش پروفایل ${conversation.name}`}
          aria-haspopup={conversation.id === "saved" || conversation.isGroup ? undefined : "dialog"}
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
              onChange={(event) => update("messageSearch", event.target.value)}
              placeholder="جستجو در پیام‌ها..."
              aria-label="جستجو در پیام‌های این گفتگو"
            />
            {messageSearch && <span>{filteredMessages.length.toLocaleString(getLocale())}</span>}
            <button type="button" tabIndex={searchOpen ? 0 : -1} onClick={() => update(["messageSearch", "searchOpen"], ["", false])} aria-label="بستن جستجو" title="بستن جستجو">
              <FiX />
            </button>
          </div>
          <IconButton
            label={searchOpen ? "بستن جستجو" : "جستجو در پیام‌ها"}
            aria-expanded={searchOpen}
            onClick={() => {
              update("searchOpen", (value) => !value);
              if (searchOpen) update("messageSearch", "");
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

      <PinnedMessagesBar messages={pinnedMessages} onSelect={jumpToPinnedMessage} />

      <div
        className="messenger-chat__messages"
        ref={messagesRef}
        aria-live="polite"
        onScroll={(event) => {
          const element = event.currentTarget;
          shouldStickToBottom.current = element.scrollHeight - element.clientHeight - element.scrollTop <= 80;
        }}
      >
        {error && <p role="alert" className="messenger-chat__error">{error}</p>}
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message, index) => (
            <MessageWithDate
              key={message.id}
              message={message}
              previous={filteredMessages[index - 1]}
              messages={messages}
              highlighted={pinnedJump?.id === message.id}
              busy={saving}
              onContextMenu={openMessageMenu}
              onPreviewImage={(image) => update("previewImage", image)}
              onTaskForwardResponse={onTaskForwardResponse}
              showSender={conversation.isGroup}
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
            <span>{conversation.id === "saved"
              ? "پیام‌های شخصی خود را اینجا ذخیره کنید"
              : conversation.isGroup ? "اولین پیام گروه را ارسال کنید" : "شروع یک گفتگوی تازه"}</span>
          </div>
        )}
      </div>

      {conversation.blockedMe ? (
        <div className="messenger-composer-blocked" role="status">
          <FiSlash aria-hidden />
          <span>این کاربر شما را بلاک کرده است و امکان ارسال پیام ندارید.</span>
        </div>
      ) : (
        <form className="messenger-composer" onSubmit={handleSubmit}>
          <div className="messenger-composer__input">
            {(replyTarget || editTarget) && (
              <div className="messenger-composer__reference">
                <span>
                  <strong>{editTarget ? "ویرایش پیام" : "پاسخ به پیام"}</strong>
                  <small>{(editTarget || replyTarget).text || (editTarget || replyTarget).fileName}</small>
                </span>
                <button type="button" onClick={() => { update(["replyTarget", "editTarget"], [null, null]); if (editTarget) onDraftChange(""); }} aria-label="لغو"><FiX /></button>
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
      )}
      {messageMenu && (
        <MessageContextMenu
          key={messageMenu.key}
          message={messageMenu.message}
          position={messageMenu.position}
          busy={saving}
          onAction={onMessageAction}
          onClose={() => update("messageMenu", null)}
          onReply={(message) => { update(["editTarget", "replyTarget"], [null, message]); inputRef.current?.focus(); }}
          onEdit={(message) => { update(["replyTarget", "editTarget"], [null, message]); onDraftChange(message.text); requestAnimationFrame(() => inputRef.current?.focus()); }}
        />
      )}
      {previewImage && (
        <ImagePreviewModal image={previewImage} onClose={closeImagePreview} />
      )}
      <ContactProfileDialog
        open={profileOpen}
        conversation={conversation}
        busy={saving}
        onBlock={onBlockUser}
        onClose={() => update("profileOpen", false)}
      />
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
