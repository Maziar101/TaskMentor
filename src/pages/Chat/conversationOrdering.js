const messageTimestamp = (message) => {
  const timestamp = Date.parse(message?.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export function sortConversationsByActivity(conversations, messagesByConversation) {
  return conversations
    .map((conversation, originalIndex) => ({
      conversation,
      originalIndex,
      lastMessageAt: messageTimestamp(messagesByConversation[conversation.id]?.at(-1)),
    }))
    .sort((first, second) => {
      if (first.conversation.pinned !== second.conversation.pinned) {
        return first.conversation.pinned ? -1 : 1;
      }
      if (first.conversation.pinned) return first.originalIndex - second.originalIndex;
      return second.lastMessageAt - first.lastMessageAt
        || first.originalIndex - second.originalIndex;
    })
    .map(({ conversation }) => conversation);
}
