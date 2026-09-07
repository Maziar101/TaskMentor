import { useEffect, useRef, useState } from "react";
import { getTagLabel } from "../utils";

export default function TaskTagDropdown({ value, tags, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectTag = (tag) => {
    onChange(tag);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="task-tag-dropdown">
      <button
        type="button"
        className="priority-dropdown__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="priority-dropdown__label">
          {value ? getTagLabel(value) : "بدون برچسب"}
        </span>
        <span className="priority-dropdown__caret" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="priority-dropdown__menu" role="listbox">
          <button
            type="button"
            className={[
              "priority-dropdown__item",
              !value && "priority-dropdown__item--active",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => selectTag("")}
          >
            بدون برچسب
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={[
                "priority-dropdown__item",
                value === tag && "priority-dropdown__item--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => selectTag(tag)}
            >
              {getTagLabel(tag)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
