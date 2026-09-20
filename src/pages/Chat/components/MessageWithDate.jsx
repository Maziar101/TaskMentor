import MessageBubble from "./MessageBubble";
import { getLocale } from "../../../i18n/runtime";

const formatDate = (value) => new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" })
  .format(new Date(value));

export default function MessageWithDate({
  message,
  previous,
  messages,
  highlighted,
  busy,
  onContextMenu,
  onPreviewImage,
  onTaskForwardResponse,
  showSender,
}) {
  const date = formatDate(message.createdAt);
  return (
    <>
      {(!previous || formatDate(previous.createdAt) !== date) && (
        <div className="messenger-chat__date"><span>{date}</span></div>
      )}
      <MessageBubble
        message={message}
        highlighted={highlighted}
        busy={busy}
        replyMessage={message.replyToId ? messages.find((item) => item.id === message.replyToId) : null}
        onContextMenu={onContextMenu}
        onPreviewImage={onPreviewImage}
        onTaskForwardResponse={onTaskForwardResponse}
        showSender={showSender}
      />
    </>
  );
}
