import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import { FiSmile, FiX } from "react-icons/fi";

const EmojiPicker = lazy(() => import("emoji-picker-react"));
const categories = [
  { category: "suggested", name: "پرکاربردها" },
  { category: "smileys_people", name: "چهره‌ها و افراد" },
  { category: "animals_nature", name: "حیوانات و طبیعت" },
  { category: "food_drink", name: "غذا و نوشیدنی" },
  { category: "travel_places", name: "سفر و مکان‌ها" },
  { category: "activities", name: "فعالیت‌ها" },
  { category: "objects", name: "اشیا" },
  { category: "symbols", name: "نمادها" },
  { category: "flags", name: "پرچم‌ها" },
];

export default function EmojiPickerButton({ disabled, onPick }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();
  const closeTimer = useRef(null);
  const cancelClose = () => clearTimeout(closeTimer.current);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className="messenger-emoji-control"
      ref={rootRef}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" || disabled) return;
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        cancelClose();
        closeTimer.current = setTimeout(() => setOpen(false), 220);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="messenger-icon-button"
        aria-label="افزودن ایموجی"
        aria-haspopup="dialog"
        aria-expanded={open && !disabled}
        aria-controls={open && !disabled ? panelId : undefined}
        disabled={disabled}
        onClick={(event) => {
          cancelClose();
          setOpen((value) => event.nativeEvent.pointerType === "mouse" ? true : !value);
        }}
      >
        <FiSmile />
      </button>
      {open && !disabled && (
        <div className="messenger-emoji-panel" id={panelId} role="dialog" aria-label="انتخاب ایموجی">
          <div className="messenger-emoji-panel__header">
            <strong>ایموجی‌ها</strong>
            <button type="button" className="messenger-icon-button" aria-label="بستن ایموجی‌ها" onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}><FiX /></button>
          </div>
          <Suspense fallback={<p className="messenger-emoji-panel__loading" role="status">در حال دریافت ایموجی‌ها…</p>}>
            <EmojiPicker
              theme="dark"
              emojiStyle="apple"
              lazyLoadEmojis
              width="100%"
              height="100%"
              autoFocusSearch={false}
              searchPlaceholder="جستجوی ایموجی (مثلاً smile یا heart)"
              categories={categories}
              previewConfig={{ showPreview: false }}
              onEmojiClick={({ emoji }) => onPick(emoji)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
