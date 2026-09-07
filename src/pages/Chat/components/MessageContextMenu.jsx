import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsPinAngle, BsPinAngleFill, BsReply } from "react-icons/bs";
import { FiCopy, FiEdit3, FiTrash2 } from "react-icons/fi";

const CLOSE_DELAY = 150;

export default function MessageContextMenu({ message, position, busy, onAction, onClose, onEdit, onReply }) {
  const menuRef = useRef(null);
  const closeTimer = useRef(null);
  const [closing, setClosing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [error, setError] = useState("");
  const [point, setPoint] = useState(position);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, CLOSE_DELAY);
  }, [closing, onClose]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const box = menu.getBoundingClientRect();
    setPoint({
      x: Math.max(8, Math.min(position.x - box.width, window.innerWidth - box.width - 8)),
      y: Math.max(8, Math.min(position.y, window.innerHeight - box.height - 8)),
    });
    menu.querySelector("button:not(:disabled)")?.focus();
  }, [position, confirmAction, error]);

  useEffect(() => {
    const dismiss = (event) => {
      if (!menuRef.current?.contains(event.target)) requestClose();
    };
    const close = () => requestClose();
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.clearTimeout(closeTimer.current);
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [requestClose]);

  const apply = async (changes) => {
    setError("");
    if (await onAction(message.id, changes)) requestClose();
    else setError("انجام نشد؛ دوباره تلاش کنید.");
  };

  const copyText = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(message.text);
      else {
        const input = document.createElement("textarea");
        input.value = message.text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      requestClose();
    } catch {
      setError("کپی متن انجام نشد.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      requestClose();
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = [...menuRef.current.querySelectorAll("button:not(:disabled)")];
      const current = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  };

  const textMessage = message.type === "text";
  return createPortal(
    <div
      ref={menuRef}
      className={`message-context-menu${closing ? " is-closing" : ""}`}
      dir="rtl"
      role={confirmAction ? "alertdialog" : "menu"}
      aria-label={confirmAction ? `تأیید ${confirmAction === "delete" ? "حذف" : "پین"} پیام` : "گزینه‌های پیام"}
      style={{ left: point.x, top: point.y }}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {confirmAction ? (
        <>
          <p>{confirmAction === "delete" ? "این پیام حذف شود؟ این کار قابل بازگشت نیست." : message.pinned ? "پین این پیام برداشته شود؟" : "این پیام پین شود؟"}</p>
          <button type="button" disabled={busy} className={confirmAction === "delete" ? "is-danger" : "is-primary"}
            onClick={() => apply(confirmAction === "delete" ? "delete" : { pinned: !message.pinned })}>
            {confirmAction === "delete" ? <FiTrash2 /> : <BsPinAngleFill />}
            {confirmAction === "delete" ? "حذف پیام" : message.pinned ? "برداشتن پین" : "پین پیام"}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirmAction(null)}>انصراف</button>
        </>
      ) : (
        <>
          <button type="button" role="menuitem" disabled={busy} onClick={() => { onReply(message); requestClose(); }}><BsReply />ریپلای</button>
          <button type="button" role="menuitem" disabled={busy || !textMessage} onClick={() => { onEdit(message); requestClose(); }}><FiEdit3 />ویرایش</button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => setConfirmAction("pin")}>
            {message.pinned ? <BsPinAngle /> : <BsPinAngleFill />}{message.pinned ? "برداشتن پین" : "پین"}
          </button>
          <button type="button" role="menuitem" disabled={busy || !textMessage} onClick={copyText}><FiCopy />کپی متن</button>
          <button type="button" role="menuitem" disabled={busy} className="is-danger" onClick={() => setConfirmAction("delete")}><FiTrash2 />حذف</button>
        </>
      )}
      {error && <p role="alert" className="is-danger">{error}</p>}
    </div>,
    document.body,
  );
}
