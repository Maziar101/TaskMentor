import { useEffect, useMemo, useReducer } from "react";
import ChatWindow from "./components/ChatWindow";
import ConversationList from "./components/ConversationList";
import { useSelector } from "react-redux";
import useChat from "./hooks/useChat";
import { sortConversationsByActivity } from "./conversationOrdering";
import { HandleReduce } from "../../utils/HandleReducer";
import "./styles.css";
import { getLocale } from "../../i18n/runtime";

const initialChatPageState = {
  selectedId: "saved",
  activeFilter: "all",
  search: "",
  draft: "",
  conversationWidth: 390,
};

const MIN_CONVERSATION_WIDTH = 88;
const MAX_CONVERSATION_WIDTH = 390;

const chatPageReducer = (state, action) => {
  if (!Object.hasOwn(state, action.type)) return state;
  const currentValue = state[action.type];
  const nextValue = typeof action.payload === "function"
    ? action.payload(currentValue)
    : action.payload;
  return Object.is(currentValue, nextValue) ? state : { ...state, [action.type]: nextValue };
};

export default function ChatPage() {
  const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  return <ChatContent key={userId} />;
}

function ChatContent() {
  const {
    conversations, contacts, messagesByConversation, loading, saving, error,
    saveMessage, uploadImage, createGroup, addContact, openContactConversation, blockUser,
    changeConversation, changeMessage, respondToTaskForward, markConversationRead, retry,
  } = useChat();
  const [state, dispatch] = useReducer(chatPageReducer, initialChatPageState);
  const handleReducer = useMemo(() => HandleReduce(dispatch), []);
  const { selectedId, activeFilter, search, draft, conversationWidth } = state;
  const setSelectedId = (payload) => handleReducer("selectedId", payload);
  const setActiveFilter = (payload) => handleReducer("activeFilter", payload);
  const setSearch = (payload) => handleReducer("search", payload);
  const setDraft = (payload) => handleReducer("draft", payload);
  const setConversationWidth = (payload) => handleReducer("conversationWidth", payload);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];
  const selectedMessages = selectedConversation
    ? messagesByConversation[selectedConversation.id] ?? []
    : [];
  const unreadIncomingKey = selectedMessages
    .filter((message) => message.side === "theirs" && !message.seen)
    .map((message) => message.id)
    .join(",");

  useEffect(() => {
    if (!selectedConversation || !unreadIncomingKey || document.visibilityState !== "visible") return;
    markConversationRead(selectedConversation.id);
  }, [markConversationRead, selectedConversation, unreadIncomingKey]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(getLocale());
    const visibleConversations = conversations.filter((conversation) => {
      const matchesSearch =
        !query ||
        conversation.name.toLocaleLowerCase(getLocale()).includes(query) ||
        conversation.preview.toLocaleLowerCase(getLocale()).includes(query);
      const matchesFilter =
        activeFilter === "archive"
          ? conversation.archived
          : !conversation.archived && (
            activeFilter === "all" ||
            (activeFilter === "unread" && conversation.unread > 0) ||
            conversation.category === activeFilter
          );
      return matchesSearch && matchesFilter;
    });
    return sortConversationsByActivity(visibleConversations, messagesByConversation);
  }, [activeFilter, conversations, messagesByConversation, search]);

  const handleSend = async (extra = {}) => {
    const text = draft.trim();
    if (!text || saving || !selectedConversation) return false;
    const success = await saveMessage(selectedConversation.id, { type: "text", text, ...extra });
    if (success) setDraft("");
    return success;
  };

  const handleAttach = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file || saving || !selectedConversation) return;
    const image = file.type.startsWith("image/") ? await uploadImage(file) : null;
    if (file.type.startsWith("image/") && !image) return;
    if (await saveMessage(selectedConversation.id, {
      type: "file", fileName: file.name, fileMeta: formatFileSize(file.size),
      ...(image ? { imageUrl: image.url, imageMime: image.mime } : {}),
    })) input.value = "";
  };

  const handleSelect = (conversationId) => {
    if (saving) return;
    setSelectedId(conversationId);
    setDraft("");
  };

  const updateConversationWidth = (event) => {
    const page = event.currentTarget.closest(".messenger-page");
    if (!page) return;
    const rect = page.getBoundingClientRect();
    const isLtr = getComputedStyle(page).direction === "ltr";
    const pointerWidth = isLtr
      ? event.clientX - rect.left
      : rect.right - event.clientX;
    const availableMaximum = Math.max(
      MIN_CONVERSATION_WIDTH,
      Math.min(MAX_CONVERSATION_WIDTH, rect.width - 320),
    );
    setConversationWidth(
      Math.round(
        Math.max(
          MIN_CONVERSATION_WIDTH,
          Math.min(availableMaximum, pointerWidth),
        ),
      ),
    );
  };

  const startConversationResize = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing-conversations");
    updateConversationWidth(event);
  };

  const stopConversationResize = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.classList.remove("is-resizing-conversations");
  };

  const resizeConversationWithKeyboard = (event) => {
    const page = event.currentTarget.closest(".messenger-page");
    const isLtr = page ? getComputedStyle(page).direction === "ltr" : true;
    let nextWidth = conversationWidth;
    if (event.key === "Home") nextWidth = MIN_CONVERSATION_WIDTH;
    if (event.key === "End") nextWidth = MAX_CONVERSATION_WIDTH;
    if (event.key === "ArrowLeft") nextWidth += isLtr ? -16 : 16;
    if (event.key === "ArrowRight") nextWidth += isLtr ? 16 : -16;
    if (nextWidth === conversationWidth) return;
    event.preventDefault();
    setConversationWidth(
      Math.max(
        MIN_CONVERSATION_WIDTH,
        Math.min(MAX_CONVERSATION_WIDTH, nextWidth),
      ),
    );
  };

  return (
    <div
      className="messenger-page"
      dir="rtl"
      style={{ "--messenger-conversations-width": `${conversationWidth}px` }}
    >
      <ConversationList
        saving={saving}
        onConversationAction={async (id, changes) => {
          const success = await changeConversation(id, changes);
          if (success && changes === "delete" && id === selectedId) {
            setSelectedId("saved");
            setDraft("");
          }
          return success;
        }}
        activeFilter={activeFilter}
        contacts={contacts}
        conversations={filteredConversations}
        onAddContact={addContact}
        onContactSelect={async (contactId) => {
          const id = await openContactConversation(contactId);
          if (id) handleSelect(id);
          return Boolean(id);
        }}
        onCreateGroup={async (payload) => {
          const result = await createGroup(payload);
          if (result.success) {
            setSelectedId(result.conversation.id);
            setDraft("");
            setActiveFilter("all");
          }
          return result;
        }}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearch}
        onSelect={handleSelect}
        search={search}
        selectedId={selectedId}
      />
      <div
        className="messenger-resize-handle"
        role="separator"
        aria-label="تغییر اندازه لیست گفتگوها"
        aria-orientation="vertical"
        aria-valuemin={MIN_CONVERSATION_WIDTH}
        aria-valuemax={MAX_CONVERSATION_WIDTH}
        aria-valuenow={conversationWidth}
        tabIndex={0}
        onDoubleClick={() => setConversationWidth(MAX_CONVERSATION_WIDTH)}
        onKeyDown={resizeConversationWithKeyboard}
        onPointerDown={startConversationResize}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateConversationWidth(event);
          }
        }}
        onPointerUp={stopConversationResize}
        onPointerCancel={stopConversationResize}
        onLostPointerCapture={() => {
          document.body.classList.remove("is-resizing-conversations");
        }}
      />
      {selectedConversation ? <ChatWindow
        saving={saving}
        error={error}
        conversation={selectedConversation}
        draft={draft}
        messages={selectedMessages}
        onAttach={handleAttach}
        onClearHistory={() => changeConversation(selectedConversation.id, "clear")}
        onDeleteConversation={async () => {
          if (selectedConversation.id === "saved") return false;
          const success = await changeConversation(selectedConversation.id, "delete");
          if (success) {
            setSelectedId("saved");
            setDraft("");
          }
          return success;
        }}
        onDraftChange={setDraft}
        onBlockUser={() => blockUser(selectedConversation.id)}
        onMessageAction={(messageId, changes) => changeMessage(selectedConversation.id, messageId, changes)}
        onTaskForwardResponse={respondToTaskForward}
        onSend={handleSend}
      /> : (
        <section className="messenger-chat">
          <div className="messenger-chat__welcome" role="status">
            <span>{loading ? "در حال دریافت گفتگوها…" : error}</span>
            {!loading && <button type="button" onClick={retry}>تلاش مجدد</button>}
          </div>
        </section>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
