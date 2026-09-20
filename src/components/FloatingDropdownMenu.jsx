import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_MARGIN = 8;
const MENU_GAP = 4;

export default function FloatingDropdownMenu({ anchorRef, menuRef, className, role, children }) {
  const [position, setPosition] = useState({ left: VIEWPORT_MARGIN, top: VIEWPORT_MARGIN, width: null });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const anchorBox = anchor.getBoundingClientRect();
    const menuBox = menu.getBoundingClientRect();
    const roomBelow = window.innerHeight - anchorBox.bottom - VIEWPORT_MARGIN;
    const openAbove = roomBelow < menuBox.height + MENU_GAP
      && anchorBox.top - VIEWPORT_MARGIN > roomBelow;
    const idealTop = openAbove
      ? anchorBox.top - menuBox.height - MENU_GAP
      : anchorBox.bottom + MENU_GAP;
    setPosition({
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(anchorBox.left, window.innerWidth - anchorBox.width - VIEWPORT_MARGIN),
      ),
      top: Math.max(
        VIEWPORT_MARGIN,
        Math.min(idealTop, window.innerHeight - menuBox.height - VIEWPORT_MARGIN),
      ),
      width: anchorBox.width,
    });
  }, [anchorRef, menuRef]);

  useLayoutEffect(updatePosition, [updatePosition]);

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    const resizeObserver = new ResizeObserver(updatePosition);
    if (anchorRef.current) resizeObserver.observe(anchorRef.current);
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver.disconnect();
    };
  }, [updatePosition]);

  return createPortal(
    <div
      ref={menuRef}
      className={className}
      role={role}
      style={{
        position: "fixed",
        left: position.left,
        right: "auto",
        top: position.top,
        width: position.width ?? undefined,
        visibility: position.width ? "visible" : "hidden",
        zIndex: 2400,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
