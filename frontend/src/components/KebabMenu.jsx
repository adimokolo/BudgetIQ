import { useEffect, useRef, useState } from "react";

export default function KebabMenu({
  items,
  ariaLabel = "Open menu",
  placement = "down",
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="kebab-menu" ref={wrapRef}>
      <button
        className="icon-btn kebab-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        ⋮
      </button>

      {open && (
        <div
          className={`kebab-panel facet-card ${placement === "up" ? "kebab-panel--up" : ""
            }`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.label}
              className={`kebab-item${item.danger ? " kebab-item--danger" : ""}`}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
