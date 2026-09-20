import { useEffect, useRef, useState } from "react";
import FloatingDropdownMenu from "../FloatingDropdownMenu";
export default function PriorityDropdown({ value, options, onChange, closeOnOutsideClick = true, }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    useEffect(() => {
        if (!closeOnOutsideClick)
            return;
        function handleClickOutside(event) {
            if (!containerRef.current)
                return;
            if (!containerRef.current.contains(event.target) && !menuRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeOnOutsideClick]);
    const selected = options.find((option) => option.id === value);
    const label = selected?.label ?? "بدون اولویت";
    const color = selected?.color ?? "var(--priority-none, #555a65)";
    return (<div ref={containerRef}>
      <button ref={buttonRef} type="button" className="priority-dropdown__button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
        <span className="priority-dot" style={{ backgroundColor: color }}/>
        <span className="priority-dropdown__label">{label}</span>
        <span className="priority-dropdown__caret">▾</span>
      </button>
      {open && (<FloatingDropdownMenu anchorRef={buttonRef} menuRef={menuRef} className="priority-dropdown__menu" role="listbox">
          {options.map((option) => (<button key={option.id ?? "none"} type="button" className={[
                    "priority-dropdown__item",
                    value === option.id && "priority-dropdown__item--active",
                ]
                    .filter(Boolean)
                    .join(" ")} onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                }}>
              <span className="priority-dot" style={{ backgroundColor: option.color }} aria-hidden/>
              <span>{option.label}</span>
            </button>))}
        </FloatingDropdownMenu>)}
    </div>);
}
