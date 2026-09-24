import { useEffect, useLayoutEffect, useRef } from "react";

function resizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export default function AutoGrowTextarea({ value, onChange, onSubmit, placeholder }) {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      className="add-form__task-title"
      rows={1}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}
