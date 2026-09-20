import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { apiRequest } from "../../../services/api";
import { HandleReduce } from "../../../utils/HandleReducer";
import { INITIAL_CONVERSATIONS } from "../data";
import { chatReducer, initialChatState } from "./chatState";
import { decorateConversation, decorateMessage, newClientId } from "./chatUtils";

export default function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const handleReducer = useMemo(() => HandleReduce(dispatch), []);
  const { conversations, contacts, messagesByConversation, loading, error, saving, reload } = state;
  const setConversations = useCallback((payload) => handleReducer("conversations", payload), [handleReducer]);
  const setContacts = useCallback((payload) => handleReducer("contacts", payload), [handleReducer]);
  const setMessages = useCallback((payload) => handleReducer("messagesByConversation", payload), [handleReducer]);
  const setLoading = useCallback((payload) => handleReducer("loading", payload), [handleReducer]);
  const setError = useCallback((payload) => handleReducer("error", payload), [handleReducer]);
  const setSaving = useCallback((payload) => handleReducer("saving", payload), [handleReducer]);
  const setReload = useCallback((payload) => handleReducer("reload", payload), [handleReducer]);
  const busy = useRef(false);
  const pending = useRef(null);

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
      window.dispatchEvent(new CustomEvent("taskmentor:chat-unread-changed", {
        detail: {
          conversationCount: data.conversations.filter((conversation) => conversation.unread > 0).length,
        },
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
  }, [reload, setContacts, setConversations, setError, setLoading, setMessages]);

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
      if (result.messageIds?.length) {
        const seenIds = new Set(result.messageIds);
        setMessages((current) => ({
          ...current,
          [conversationId]: (current[conversationId] ?? []).map((message) =>
            seenIds.has(message.id) ? { ...message, seen: true } : message),
        }));
      }
      setConversations((current) => current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation));
      window.dispatchEvent(new Event("taskmentor:chat-unread-changed"));
      return true;
    } catch {
      return false;
    }
  }, [setConversations, setMessages]);

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

  const createGroup = async ({ name, imageFile, memberIds }) => {
    if (busy.current || loading) return { success: false, error: "لطفاً کمی صبر کنید" };
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", name);
      body.append("memberIds", JSON.stringify(memberIds));
      if (imageFile) body.append("image", imageFile);
      const { conversation } = await apiRequest("/api/chat/groups", { method: "POST", body });
      const decorated = decorateConversation(conversation);
      setConversations((current) => [...current, decorated]);
      setMessages((current) => ({ ...current, [decorated.id]: [] }));
      return { success: true, conversation: decorated };
    } catch (err) {
      const message = err.message || "ساخت گروه ناموفق بود";
      setError(`گروه ساخته نشد: ${message}`);
      return { success: false, error: message };
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

  const blockUser = async (conversationId) => {
    if (busy.current || loading) return { success: false, error: "لطفاً کمی صبر کنید" };
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/chat/${encodeURIComponent(conversationId)}/block`, { method: "PUT" });
      setConversations((current) => current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, blockedByMe: true } : conversation));
      return { success: true };
    } catch (err) {
      const message = err.message || "بلاک کردن کاربر ناموفق بود";
      setError(message);
      return { success: false, error: message };
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

  const respondToTaskForward = async (requestId, decision) => {
    if (busy.current || loading) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const { taskForward } = await apiRequest(`/api/chat/task-forwards/${encodeURIComponent(requestId)}`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      setMessages((current) => Object.fromEntries(
        Object.entries(current).map(([conversationId, messages]) => [
          conversationId,
          messages.map((message) => message.taskForward?.id === requestId
            ? { ...message, taskForward }
            : message),
        ]),
      ));
      return true;
    } catch (err) {
      setError(`پاسخ درخواست ثبت نشد: ${err.message || "دوباره تلاش کنید"}`);
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
      if (deleting || clearing) {
        window.dispatchEvent(new Event("taskmentor:chat-unread-changed"));
      }
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
    conversations, contacts, messagesByConversation, loading, saving, error, saveMessage, uploadImage, createConversation, createGroup,
    addContact, openContactConversation, blockUser, changeConversation, changeMessage, respondToTaskForward, markConversationRead,
    retry: () => { setLoading(true); setReload((value) => value + 1); },
  };
}
