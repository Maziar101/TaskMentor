import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../services/api";
import { INITIAL_CONVERSATIONS } from "../data";

const newClientId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");

const timeFormat = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });
const decorateMessage = (message) => ({ ...message, time: timeFormat.format(new Date(message.createdAt)) });
const decorateConversation = (conversation) => ({
  ...(conversation.id === "saved" ? INITIAL_CONVERSATIONS[0] : {
    preview: "هنوز پیامی ارسال نشده", time: "", unread: 0,
    category: "all", avatar: "+", avatarTone: "violet",
  }),
  ...conversation,
});

export default function useChat() {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messagesByConversation, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const pending = useRef(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const loadChat = () => apiRequest("/api/chat").then((data) => {
      if (!active) return;
      const grouped = {};
      for (const message of data.messages) {
        grouped[message.conversationId] = grouped[message.conversationId] || [];
        grouped[message.conversationId].push(decorateMessage(message));
      }
      setMessages(grouped);
      setContacts(data.contacts ?? []);
      setConversations(data.conversations.map((item) => {
        const last = grouped[item.id]?.at(-1);
        return {
          ...decorateConversation(item),
          ...(last ? { preview: last.text || last.fileName, time: last.time } : {}),
        };
      }));
      setError("");
    }).catch((err) => {
      if (active) setError(err.message || "دریافت گفتگوها ناموفق بود");
    }).finally(() => {
      if (active) setLoading(false);
    });
    loadChat();
    const interval = window.setInterval(loadChat, 4000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [reload]);

  const saveMessage = async (conversationId, payload) => {
    if (busy.current || loading) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    const fingerprint = JSON.stringify([conversationId, payload]);
    if (pending.current?.fingerprint !== fingerprint) {
      pending.current = { fingerprint, id: newClientId() };
    }
    try {
      const { message } = await apiRequest(`/api/chat/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST", body: JSON.stringify({ ...payload, id: pending.current.id }),
      });
      const saved = decorateMessage(message);
      setMessages((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] ?? []).filter((item) => item.id !== saved.id), saved],
      }));
      setConversations((current) => current.map((item) => item.id === conversationId
        ? { ...item, preview: saved.text || saved.fileName, time: saved.time, unread: 0 } : item));
      pending.current = null;
      return true;
    } catch (err) {
      setError(`پیام ذخیره نشد: ${err.message || "دوباره تلاش کنید"}`);
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const uploadImage = async (file) => {
    if (busy.current || loading) return null;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const { image } = await apiRequest("/api/chat/uploads/images", { method: "POST", body });
      return image;
    } catch (err) {
      setError(`تصویر ارسال نشد: ${err.message || "دوباره تلاش کنید"}`);
      return null;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const markConversationRead = useCallback(async (conversationId) => {
    try {
      const result = await apiRequest(`/api/chat/${encodeURIComponent(conversationId)}/read`, {
        method: "PATCH",
      });
      if (!result.messageIds?.length) return true;
      const seenIds = new Set(result.messageIds);
      setMessages((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((message) =>
          seenIds.has(message.id) ? { ...message, seen: true } : message),
      }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const createConversation = async () => {
    if (busy.current || loading) return null;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const { conversation } = await apiRequest("/api/chat/conversations", {
        method: "POST", body: JSON.stringify({ id: newClientId(), name: "گفتگوی جدید" }),
      });
      setConversations((current) => [...current, decorateConversation(conversation)]);
      return conversation.id;
    } catch (err) {
      setError(`گفتگو ذخیره نشد: ${err.message || "دوباره تلاش کنید"}`);
      return null;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const addContact = async (phone) => {
    if (busy.current || loading) return { success: false, error: "لطفاً کمی صبر کنید" };
    busy.current = true;
    setSaving(true);
    try {
      const { contact } = await apiRequest("/api/chat/contacts", {
        method: "POST", body: JSON.stringify({ phone }),
      });
      setContacts((current) => [...current, contact]);
      return { success: true, contact };
    } catch (err) {
      return { success: false, error: err.message || "افزودن مخاطب ناموفق بود" };
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const openContactConversation = async (contactId) => {
    if (busy.current || loading) return null;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const { conversation } = await apiRequest(`/api/chat/contacts/${encodeURIComponent(contactId)}/conversation`, {
        method: "POST",
      });
      const decorated = decorateConversation(conversation);
      setConversations((current) => current.some((item) => item.id === decorated.id)
        ? current.map((item) => item.id === decorated.id ? { ...item, ...decorated } : item)
        : [...current, decorated]);
      return decorated.id;
    } catch (err) {
      setError(`باز کردن گفتگو ناموفق بود: ${err.message || "دوباره تلاش کنید"}`);
      return null;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const changeMessage = async (conversationId, messageId, changes) => {
    if (busy.current || loading) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const deleting = changes === "delete";
      const result = await apiRequest(`/api/chat/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`, {
        method: deleting ? "DELETE" : "PATCH",
        ...(deleting ? {} : { body: JSON.stringify(changes) }),
      });
      setMessages((current) => {
        const nextMessages = deleting
          ? (current[conversationId] ?? []).filter((item) => item.id !== messageId)
          : (current[conversationId] ?? []).map((item) => item.id === messageId
            ? decorateMessage(result.message) : item);
        return { ...current, [conversationId]: nextMessages };
      });
      if (deleting || Object.hasOwn(changes, "text")) {
        setConversations((current) => current.map((item) => {
          if (item.id !== conversationId) return item;
          const currentMessages = messagesByConversation[conversationId] ?? [];
          const nextMessages = deleting
            ? currentMessages.filter((message) => message.id !== messageId)
            : currentMessages.map((message) => message.id === messageId ? decorateMessage(result.message) : message);
          const last = nextMessages.at(-1);
          return { ...item, preview: last?.text || last?.fileName || "هنوز پیامی ارسال نشده", time: last?.time || "" };
        }));
      }
      return true;
    } catch (err) {
      setError(`تغییر پیام ذخیره نشد: ${err.message || "دوباره تلاش کنید"}`);
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const changeConversation = async (id, changes) => {
    if (busy.current || loading) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const deleting = changes === "delete";
      const clearing = changes === "clear";
      const result = await apiRequest(`/api/chat/${encodeURIComponent(id)}${clearing ? "/history" : ""}`, {
        method: deleting || clearing ? "DELETE" : "PATCH",
        ...(deleting || clearing ? {} : { body: JSON.stringify(changes) }),
      });
      setConversations((current) => deleting
        ? current.filter((item) => item.id !== id)
        : current.map((item) => item.id === id ? {
          ...item, ...result.conversation,
          ...(clearing ? {
            preview: id === "saved" ? INITIAL_CONVERSATIONS[0].preview : "هنوز پیامی ارسال نشده",
            time: "",
            unread: 0,
          } : {}),
        } : item));
      if (deleting || clearing) setMessages((current) => ({ ...current, [id]: [] }));
      return true;
    } catch (err) {
      setError(`تغییر گفتگو ذخیره نشد: ${err.message || "دوباره تلاش کنید"}`);
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return {
    conversations, contacts, messagesByConversation, loading, saving, error, saveMessage, uploadImage, createConversation,
    addContact, openContactConversation, changeConversation, changeMessage, markConversationRead,
    retry: () => { setLoading(true); setReload((value) => value + 1); },
  };
}
