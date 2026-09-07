import { useLayoutEffect, useRef } from "react";

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
