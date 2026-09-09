import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { emojiImageUrl, splitEmojiText } from "../emojiUtils";

function readText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeName === "IMG") return node.getAttribute("alt") || "";
  return Array.from(node.childNodes).map(readText).join("");
}

const MessageInput = forwardRef(function MessageInput({ value, onChange, onSend, disabled }, ref) {
  const editorRef = useRef(null);
  const composing = useRef(false);
  const savedRange = useRef({ start: value.length, end: value.length });

  const capture = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) return savedRange.current;
    const range = selection.getRangeAt(0);
    const prefix = range.cloneRange();
    prefix.selectNodeContents(editor);
    prefix.setEnd(range.startContainer, range.startOffset);
    const start = readText(prefix.cloneContents()).length;
    savedRange.current = { start, end: start + readText(range.cloneContents()).length };
    return savedRange.current;
  };

  const restore = (start, end = start) => {
    const editor = editorRef.current;
    const locate = (offset) => {
      let remaining = offset;
      for (let index = 0; index < editor.childNodes.length; index += 1) {
        const node = editor.childNodes[index];
        const length = readText(node).length;
        if (remaining <= length) {
          return node.nodeType === Node.TEXT_NODE
            ? [node, remaining]
            : [editor, index + (remaining > 0 ? 1 : 0)];
        }
        remaining -= length;
      }
      return [editor, editor.childNodes.length];
    };
    const range = document.createRange();
    range.setStart(...locate(start));
    range.setEnd(...locate(end));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange.current = { start, end };
  };

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current.focus(),
    get selectionStart() { return capture().start; },
    get selectionEnd() { return capture().end; },
    setSelectionRange: restore,
  }));

  useLayoutEffect(() => {
    if (composing.current) return;
    const editor = editorRef.current;
    const focused = document.activeElement === editor;
    const cursor = capture();
    const nodes = splitEmojiText(value).map((part) => {
      if (!part.emoji) return document.createTextNode(part.text);
      const image = document.createElement("img");
      image.src = emojiImageUrl(part.text);
      image.alt = part.text;
      image.className = "messenger-inline-emoji";
      image.draggable = false;
      image.addEventListener("error", () => image.replaceWith(document.createTextNode(part.text)), { once: true });
      return image;
    });
    editor.replaceChildren(...nodes);
    if (focused) restore(Math.min(cursor.start, value.length), Math.min(cursor.end, value.length));
  }, [value]);

  const insertText = (text) => {
    const { start, end } = capture();
    const next = value.slice(0, start) + text + value.slice(end);
    if (next.length > 10000) return;
    onChange(next);
    requestAnimationFrame(() => restore(start + text.length));
  };

  return <div
    ref={editorRef}
    className="messenger-message-input"
    contentEditable={!disabled}
    suppressContentEditableWarning
    role="textbox"
    aria-label="متن پیام"
    aria-disabled={disabled}
    data-placeholder="پیام خود را بنویسید..."
    onBlur={capture}
    onKeyUp={capture}
    onMouseUp={capture}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={() => {
      composing.current = false;
      capture();
      onChange(readText(editorRef.current).slice(0, 10000));
    }}
    onInput={() => {
      capture();
      if (!composing.current) onChange(readText(editorRef.current).slice(0, 10000));
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        if (disabled) return;
        if (event.shiftKey) {
          insertText("\n");
          return;
        }
        onSend();
      }
    }}
    onPaste={(event) => {
      event.preventDefault();
      insertText(event.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " "));
    }}
    onCopy={(event) => {
      const { start, end } = capture();
      event.preventDefault();
      event.clipboardData.setData("text/plain", value.slice(start, end));
    }}
    onCut={(event) => {
      const { start, end } = capture();
      event.preventDefault();
      event.clipboardData.setData("text/plain", value.slice(start, end));
      if (!disabled) insertText("");
    }}
    onDrop={(event) => event.preventDefault()}
  />;
});

export default MessageInput;
