import EmojiText from "./EmojiText";
import { FiEdit2, FiFileText } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { IoCheckmarkDone } from "react-icons/io5";
import { MdDone } from "react-icons/md";
import TaskForwardMessage from "./TaskForwardMessage";
import { getLocale } from "../../../i18n/runtime";

export default function MessageBubble({ message, replyMessage, highlighted, busy, onContextMenu, onPreviewImage, onTaskForwardResponse, showSender }) {
  const className = [
    "messenger-message",
    message.side === "mine" ? "messenger-message--mine" : "messenger-message--theirs",
    highlighted && "is-pinned-target",
  ].filter(Boolean).join(" ");

  if (message.type === "task-forward") {
    return (
      <div data-message-id={message.id} className={`${className} messenger-message--task-forward`} onContextMenu={(event) => onContextMenu(event, message)}>
        <MessageSender message={message} visible={showSender} />
        <MessageReply message={replyMessage} />
        <TaskForwardMessage message={message} busy={busy} onRespond={onTaskForwardResponse} />
        <MessageMeta message={message} />
        <MessageReactions reactions={message.reactions} />
      </div>
    );
  }

  if (message.type === "file") {
    return (
      <div data-message-id={message.id} className={`${className}${message.imageUrl ? " messenger-message--image" : ""}`} onContextMenu={(event) => onContextMenu(event, message)}>
        <MessageSender message={message} visible={showSender} />
        <MessageReply message={replyMessage} />
        {message.imageUrl ? (
          <button
            className="messenger-image-preview"
            type="button"
            onClick={() => onPreviewImage(message)}
            aria-label={`پیش‌نمایش تصویر ${message.fileName}`}
          >
            <img src={message.imageUrl} alt={message.fileName} />
          </button>
        ) : (
          <div className="messenger-file">
            <span className="messenger-file__icon" aria-hidden>
              <FiFileText />
            </span>
            <span>
              <strong>{message.fileName}</strong>
              <small>{message.fileMeta}</small>
            </span>
          </div>
        )}
        <MessageMeta message={message} />
        <MessageReactions reactions={message.reactions} />
      </div>
    );
  }

  return (
    <div data-message-id={message.id} className={className} onContextMenu={(event) => onContextMenu(event, message)}>
      <MessageSender message={message} visible={showSender} />
      <MessageReply message={replyMessage} />
      <p><EmojiText text={message.text} /></p>
      <MessageMeta message={message} />
      <MessageReactions reactions={message.reactions} />
    </div>
  );
}

function MessageSender({ message, visible }) {
  if (!visible || message.side === "mine" || !message.senderName) return null;
  return <strong className="messenger-message__sender">{message.senderName}</strong>;
}

function MessageReactions({ reactions }) {
  if (!reactions?.length) return null;
  return (
    <span className="messenger-message__reactions" aria-label="ری‌اکشن‌های پیام">
      {reactions.map(({ emoji, count }) => (
        <span key={emoji} title={`${count.toLocaleString(getLocale())} ری‌اکشن`}>
          <span aria-hidden><EmojiText text={emoji} /></span>
          {count > 1 && <small>{count.toLocaleString(getLocale())}</small>}
        </span>
      ))}
    </span>
  );
}

function MessageMeta({ message }) {
  return (
    <span className="messenger-message__meta">
      <time>{message.time}</time>
      {message.edited && <FiEdit2 aria-label="ویرایش‌شده" title="ویرایش‌شده" />}
      {message.pinned && <BsPinAngleFill aria-label="پین‌شده" title="پین‌شده" />}
      {message.side === "mine" && (message.seen
        ? <IoCheckmarkDone aria-label="دیده‌شده" title="دیده‌شده" />
        : <MdDone aria-label="ارسال‌شده" title="ارسال‌شده" />)}
    </span>
  );
}

function MessageReply({ message }) {
  if (!message) return null;
  return (
    <span className="messenger-message__reply">
      <strong>پاسخ به پیام</strong>
      <small>{message.text || message.fileName || "پیام حذف‌شده"}</small>
    </span>
  );
}
