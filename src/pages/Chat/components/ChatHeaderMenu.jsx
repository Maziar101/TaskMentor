import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiClock, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import DeleteModal from "../../../components/DeleteModal";

export default function ChatHeaderMenu({
  conversation,
  busy,
  onClearHistory,
  onDeleteChat,
}) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [point, setPoint] = useState({ x: 8, y: 8 });

  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;
    const anchor = button.getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    setPoint({
      x: Math.max(8, Math.min(anchor.left, window.innerWidth - box.width - 8)),
      y: Math.max(8, Math.min(anchor.bottom + 8, window.innerHeight - box.height - 8)),
    });
    menu.querySelector("button")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setAction(null);
  }, [conversation.id]);

  const confirm = async () => {
    const success = action === "clear"
      ? await onClearHistory()
      : await onDeleteChat();
    if (success) setAction(null);
  };

  const clearing = action === "clear";

  return (
    <>
      <button
        ref={buttonRef}
        className="messenger-icon-button"
        type="button"
        aria-label="گزینه‌های بیشتر"
        title="گزینه‌های بیشتر"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FiMoreVertical />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="conversation-context-menu chat-header-context-menu"
          dir="rtl"
          role="menu"
          aria-label={`گزینه‌های ${conversation.name}`}
          style={{ left: point.x, top: point.y }}
        >
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setAction("clear"); }}>
            <FiClock />پاک کردن تاریخچه
          </button>
          {conversation.id !== "saved" && (
            <button className="is-danger" type="button" role="menuitem" onClick={() => { setOpen(false); setAction("delete"); }}>
              <FiTrash2 />حذف گفتگو
            </button>
          )}
        </div>,
        document.body,
      )}

      {createPortal(
        <DeleteModal
          open={Boolean(action)}
          title={clearing ? "تاریخچه گفتگو پاک شود؟" : "گفتگو حذف شود؟"}
          description={clearing
            ? `همه پیام‌های «${conversation.name}» پاک می‌شوند، اما خود گفتگو باقی می‌ماند.`
            : `گفتگوی «${conversation.name}» حذف می‌شود. این کار قابل بازگشت نیست.`}
          confirmLabel={clearing ? "پاک کردن تاریخچه" : "حذف گفتگو"}
          cancelLabel="انصراف"
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setAction(null)}
        />,
        document.body,
      )}
    </>
  );
}
