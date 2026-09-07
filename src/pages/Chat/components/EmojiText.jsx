import { useState } from "react";

import { splitEmojiText, emojiImageUrl } from "../emojiUtils";

function EmojiImage({ text }) {
  const [failed, setFailed] = useState(false);
  return failed ? text : <img className="messenger-inline-emoji" src={emojiImageUrl(text)} alt={text} draggable={false} onError={() => setFailed(true)} />;
}

export default function EmojiText({ text }) {
  return splitEmojiText(text).map((part, index) => part.emoji
    ? <EmojiImage key={`${index}-${part.text}`} text={part.text} /> : part.text);
}
