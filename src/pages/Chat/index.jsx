import { useMemo, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import ConversationList from "./components/ConversationList";
import { useSelector } from "react-redux";
import useChat from "./hooks/useChat";
import "./styles.css";

export default function ChatPage() {
  const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  return <ChatContent key={userId} />;
}

function ChatContent() {
  const { conversations, messagesByConversation, loading, saving, error, saveMessage, createConversation, changeConversation, changeMessage, retry } = useChat();
  const [selectedId, setSelectedId] = useState("saved");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fa");
    return conversations.filter((conversation) => {
      const matchesSearch =
        !query ||
        conversation.name.toLocaleLowerCase("fa").includes(query) ||
        conversation.preview.toLocaleLowerCase("fa").includes(query);
      const matchesFilter =
        activeFilter === "archive"
          ? conversation.archived
          : !conversation.archived && (
            activeFilter === "all" ||
            (activeFilter === "unread" && conversation.unread > 0) ||
            conversation.category === activeFilter
          );
      return matchesSearch && matchesFilter;
    }).sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [activeFilter, conversations, search]);

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
    if (await saveMessage(selectedConversation.id, {
      type: "file", fileName: file.name, fileMeta: formatFileSize(file.size),
    })) input.value = "";
  };

  const handleSelect = (conversationId) => {
    if (saving) return;
    setSelectedId(conversationId);
    setDraft("");
  };

  const handleNewConversation = async () => {
    const id = await createConversation();
    if (!id) return;
    setSelectedId(id);
    setDraft("");
    setActiveFilter("all");
  };

  return (
    <div className="messenger-page" dir="rtl">
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
        conversations={filteredConversations}
        onFilterChange={setActiveFilter}
        onNewConversation={handleNewConversation}
        onSearchChange={setSearch}
        onSelect={handleSelect}
        search={search}
        selectedId={selectedId}
      />
      {selectedConversation ? <ChatWindow
        saving={saving}
        error={error}
        conversation={selectedConversation}
        draft={draft}
        messages={messagesByConversation[selectedConversation.id] ?? []}
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
        onMessageAction={(messageId, changes) => changeMessage(selectedConversation.id, messageId, changes)}
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
