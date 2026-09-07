const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const emojiPattern = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u;
export const splitEmojiText = (text = "") => {
  const parts = [];
  for (const { segment } of segmenter.segment(text)) {
    const emoji = emojiPattern.test(segment);
    const last = parts[parts.length - 1];
    if (!emoji && last && !last.emoji) last.text += segment;
    else parts.push({ text: segment, emoji });
  }
  return parts;
};
export const emojiImageUrl = (text) => `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${Array.from(text).filter((char) => char !== "\ufe0f").map((char) => char.codePointAt(0).toString(16).padStart(4, "0")).join("-")}.png`;
