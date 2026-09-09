import EmojiText from "./EmojiText";
import { FiEdit2, FiFileText } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { IoCheckmarkDone } from "react-icons/io5";
import { MdDone } from "react-icons/md";

export default function MessageBubble({ message, replyMessage, onContextMenu, onPreviewImage }) {
  const className = [
    "messenger-message",
    message.side === "mine" ? "messenger-message--mine" : "messenger-message--theirs",
  ].join(" ");

  if (message.type === "file") {
    return (
      <div className={`${className}${message.imageUrl ? " messenger-message--image" : ""}`} onContextMenu={(event) => onContextMenu(event, message)}>
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
      </div>
    );
  }

  return (
    <div className={className} onContextMenu={(event) => onContextMenu(event, message)}>
      <MessageReply message={replyMessage} />
      <p><EmojiText text={message.text} /></p>
      <MessageMeta message={message} />
    </div>
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
