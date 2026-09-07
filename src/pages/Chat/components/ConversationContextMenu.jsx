import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiBell, FiBellOff, FiArchive, FiTrash2 } from "react-icons/fi";
import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";

export default function ConversationContextMenu({ conversation, position, busy, onAction, onClose }) {
  const menuRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [point, setPoint] = useState(position);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const box = menu.getBoundingClientRect();
    setPoint({
      x: Math.max(8, Math.min(position.x, window.innerWidth - box.width - 8)),
      y: Math.max(8, Math.min(position.y, window.innerHeight - box.height - 8)),
    });
    menu.querySelector('button:not(:disabled)')?.focus();
  }, [position, confirmDelete, error]);

  useEffect(() => {
    const dismiss = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose();
    };
    const close = () => onClose();
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [onClose]);

  const apply = async (changes) => {
    setError("");
    if (await onAction(conversation.id, changes)) onClose();
    else setError("انجام نشد؛ دوباره تلاش کنید.");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      onClose();
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = [...menuRef.current.querySelectorAll('button:not(:disabled)')];
      const current = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  };

  const saved = conversation.id === "saved";
  return createPortal(
    <div ref={menuRef} className="conversation-context-menu" dir="rtl"
      role={confirmDelete ? "alertdialog" : "menu"}
      aria-label={confirmDelete ? "تأیید حذف گفتگو" : `گزینه‌های ${conversation.name}`}
      style={{ left: point.x, top: point.y }} onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}>
      {confirmDelete ? (
        <>
          <p>{saved ? "پیام‌های Save Message پاک شوند؟" : `گفتگوی «${conversation.name}» حذف شود؟`}</p>
          <button type="button" disabled={busy} className="is-danger" onClick={() => apply(saved ? "clear" : "delete")}>
            <FiTrash2 />{saved ? "پاک کردن پیام‌ها" : "حذف گفتگو"}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>انصراف</button>
        </>
      ) : (
        <>
          <button type="button" role="menuitem" disabled={busy} onClick={() => apply({ pinned: !conversation.pinned })}>
            {conversation.pinned ? <BsPinAngle /> : <BsPinAngleFill />}
            {conversation.pinned ? "برداشتن پین" : "پین کردن"}
          </button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => apply({ muted: !conversation.muted })}>
            {conversation.muted ? <FiBell /> : <FiBellOff />}
            {conversation.muted ? "فعال کردن نوتیف‌ها" : "میوت کردن نوتیف‌ها"}
          </button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => apply({ archived: !conversation.archived })}>
            <FiArchive />{conversation.archived ? "خارج کردن از آرشیو" : "آرشیو"}
          </button>
          <hr />
          <button type="button" role="menuitem" disabled={busy} className="is-danger" onClick={() => setConfirmDelete(true)}>
            <FiTrash2 />{saved ? "پاک کردن پیام‌ها" : "حذف گفتگو"}
          </button>
        </>
      )}
      {error && <p role="alert" className="is-danger">{error}</p>}
    </div>, document.body,
  );
}
