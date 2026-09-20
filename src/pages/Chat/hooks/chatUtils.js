import { INITIAL_CONVERSATIONS } from "../data";
import { getLocale } from "../../../i18n/runtime";

export const newClientId = () => Array.from(
  crypto.getRandomValues(new Uint8Array(16)),
  (byte) => byte.toString(16).padStart(2, "0"),
).join("");

const timeFormat = new Intl.DateTimeFormat(getLocale(), { hour: "2-digit", minute: "2-digit" });

export const decorateMessage = (message) => ({
  ...message,
  time: timeFormat.format(new Date(message.createdAt)),
});

export const decorateConversation = (conversation) => ({
  ...(conversation.id === "saved" ? INITIAL_CONVERSATIONS[0] : {
    preview: "هنوز پیامی ارسال نشده",
    time: "",
    unread: 0,
    category: "all",
    avatar: "+",
    avatarTone: "violet",
  }),
  ...conversation,
});
