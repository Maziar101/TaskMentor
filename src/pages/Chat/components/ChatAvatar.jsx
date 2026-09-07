export default function ChatAvatar({ conversation, size = "normal" }) {
  const Icon = conversation.icon;

  return (
    <span
      className={[
        "messenger-avatar",
        `messenger-avatar--${size}`,
        conversation.avatarTone && `messenger-avatar--${conversation.avatarTone}`,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {Icon ? <Icon /> : conversation.avatar || conversation.name.slice(0, 1)}
      {conversation.online && <i className="messenger-avatar__online" />}
    </span>
  );
}
