import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiSend, FiX } from "react-icons/fi";
import { TiArrowForwardOutline } from "react-icons/ti";
import { apiRequest } from "../../../services/api";
import { HotToast } from "../../../utils/HotToast";
import { formatHour } from "../utils";
import { getLocale } from "../../../i18n/runtime";

const MENU_MARGIN = 8;

export default function ForwardTaskMenu({ task, hour = task.hour, duration = task.duration }) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ left: MENU_MARGIN, top: MENU_MARGIN });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !menuRef.current) return;
    const anchor = anchorRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    setPosition({
      left: Math.max(MENU_MARGIN, Math.min(anchor.right - menu.width, window.innerWidth - menu.width - MENU_MARGIN)),
      top: Math.max(MENU_MARGIN, Math.min(anchor.bottom + 8, window.innerHeight - menu.height - MENU_MARGIN)),
    });
  }, [open, recipients, loading, error]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const search = query.trim();
        const data = await apiRequest(`/api/chat/task-recipients${search ? `?q=${encodeURIComponent(search)}` : ""}`, {
          signal: controller.signal,
        });
        setRecipients(data.recipients ?? []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setRecipients([]);
          setError(requestError.message || "دریافت کاربران انجام نشد");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (!menuRef.current?.contains(event.target) && !anchorRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);
    const closeOnOutsideScroll = (event) => {
      if (!menuRef.current?.contains(event.target)) close();
    };
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", closeOnOutsideScroll, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", closeOnOutsideScroll, true);
    };
  }, [open]);

  const openMenu = () => {
    setOpen(true);
    setQuery("");
    setSelectedId("");
    setError("");
  };

  const sendTask = async (event) => {
    event.preventDefault();
    if (!selectedId || sending) return;
    setSending(true);
    setError("");
    const recipient = recipients.find((item) => item.id === selectedId);
    try {
      await apiRequest("/api/chat/task-forwards", {
        method: "POST",
        body: JSON.stringify({
          ...(recipient?.kind === "group" ? { groupId: selectedId } : { recipientId: selectedId }),
          sourceTaskId: task.id,
          hour,
          duration: Math.max(1, Number(duration) || 1),
        }),
      });
      setOpen(false);
      HotToast("success", `درخواست تسک برای ${recipient?.name || "کاربر انتخاب‌شده"} ارسال شد`);
    } catch (requestError) {
      setError(requestError.message || "ارسال تسک انجام نشد");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        ref={anchorRef}
        className="icon-btn"
        type="button"
        aria-label={`فوروارد تسک ${task.title}`}
        title="فوروارد تسک"
        aria-haspopup="dialog"
        aria-expanded={open}
        draggable={false}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={openMenu}
      >
        <TiArrowForwardOutline aria-hidden />
      </button>
      {open && createPortal(
        <form
          ref={menuRef}
          className="task-forward-menu"
          dir="rtl"
          role="dialog"
          aria-labelledby={`task-forward-title-${task.id}`}
          style={position}
          onSubmit={sendTask}
          onDragStart={(event) => event.preventDefault()}
        >
          <header className="task-forward-menu__header">
            <span>
              <strong id={`task-forward-title-${task.id}`}>فوروارد تسک</strong>
              <small>{task.title} · ساعت {formatHour(hour)}</small>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن">
              <FiX aria-hidden />
            </button>
          </header>
          <label className="task-forward-menu__search">
            <FiSearch aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedId("");
              }}
              placeholder="جستجو براساس نام یا شماره تلفن"
              aria-label="جستجوی کاربر براساس نام یا شماره تلفن"
            />
          </label>
          <div className="task-forward-menu__label">
            {query.trim() ? "نتایج جستجو" : "گفتگوهای اخیر"}
          </div>
          <div className="task-forward-menu__list" role="radiogroup" aria-label="انتخاب گیرنده">
            {loading ? (
              <p>در حال جستجو…</p>
            ) : recipients.length ? recipients.map((recipient) => (
              <button
                key={recipient.id}
                className={selectedId === recipient.id ? "is-selected" : ""}
                type="button"
                role="radio"
                aria-checked={selectedId === recipient.id}
                onClick={() => setSelectedId(recipient.id)}
              >
                <span className="task-forward-menu__avatar" aria-hidden>
                  {recipient.avatarUrl ? <img src={recipient.avatarUrl} alt="" /> : recipient.avatar}
                </span>
                <span>
                  <strong>{recipient.name}</strong>
                  <small>{recipient.kind === "group"
                    ? `${recipient.memberCount.toLocaleString(getLocale())} عضو`
                    : recipient.phone || "شماره ثبت نشده"}</small>
                </span>
                <i aria-hidden />
              </button>
            )) : (
              <p>{query.trim() ? "کاربری پیدا نشد" : "هنوز گفتگوی اخیری ندارید؛ نام یا شماره را جستجو کنید."}</p>
            )}
          </div>
          {error && <p className="task-forward-menu__error" role="alert">{error}</p>}
          <button className="task-forward-menu__send" type="submit" disabled={!selectedId || sending}>
            <FiSend aria-hidden />
            {sending ? "در حال ارسال…" : "ارسال"}
          </button>
        </form>,
        document.body,
      )}
    </>
  );
}
