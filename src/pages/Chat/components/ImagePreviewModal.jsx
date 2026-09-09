import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiDownload, FiX } from "react-icons/fi";

export default function ImagePreviewModal({ image, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="messenger-image-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`پیش‌نمایش ${image.fileName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="messenger-image-modal__toolbar">
        <a
          href={image.imageUrl}
          download={image.fileName}
          aria-label="دانلود تصویر"
          title="دانلود تصویر"
        >
          <FiDownload />
        </a>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="بستن پیش‌نمایش"
          title="بستن"
        >
          <FiX />
        </button>
      </div>
      <img src={image.imageUrl} alt={image.fileName} />
    </div>,
    document.body,
  );
}
