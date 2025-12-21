import { useEffect, useRef, useState } from "react";

export type PriorityOption<T extends string | undefined> = {
  id?: T;
  label: string;
  color: string;
};

type PriorityDropdownProps<T extends string | undefined> = {
  value?: T;
  options: Array<PriorityOption<T>>;
  onChange: (value?: T) => void;
  closeOnOutsideClick?: boolean;
};

export default function PriorityDropdown<T extends string | undefined>({
  value,
  options,
  onChange,
  closeOnOutsideClick = true,
}: PriorityDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!closeOnOutsideClick) return;
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeOnOutsideClick]);

  const selected = options.find((option) => option.id === value);
  const label = selected?.label ?? "بدون اولویت";
  const color = selected?.color ?? "var(--priority-none, #555a65)";

  return (
    <div ref={containerRef}>
      <button
        type="button"
        className="priority-dropdown__button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="priority-dot" style={{ backgroundColor: color }} />
        <span className="priority-dropdown__label">{label}</span>
        <span className="priority-dropdown__caret">▾</span>
      </button>
      {open && (
        <div className="priority-dropdown__menu">
          {options.map((option) => (
            <button
              key={option.id ?? "none"}
              type="button"
              className={[
                "priority-dropdown__item",
                value === option.id && "priority-dropdown__item--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <span
                className="priority-dot"
                style={{ backgroundColor: option.color }}
                aria-hidden
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
