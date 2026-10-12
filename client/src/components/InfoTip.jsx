import React, { useState } from 'react';
import './InfoTip.css';

// Small "?" helper that shows a plain-words explanation on hover (web)
// and on tap (mobile). Use next to technical terms customers may not know.
// position: 'above' (default) or 'below' — use 'below' when the tip sits
// near a card top where an upward bubble would get clipped.
// Pass `text` for a single paragraph, or `items` ([{ label, text, tone }])
// for a structured list with color-coded labels (e.g. grading guides).
const InfoTip = ({ text, items, position = 'above' }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="infotip-wrap">
      <button
        type="button"
        className={`infotip-btn${open ? ' open' : ''}`}
        aria-label="What does this mean?"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span className={`infotip-bubble ${position}`} role="tooltip">
          {items?.length ? (
            <span className="infotip-rows">
              {items.map((item) => (
                <span key={item.label} className="infotip-row">
                  <strong className={`infotip-grade tone-${item.tone || 'neutral'}`}>{item.label}</strong>
                  <span>{item.text}</span>
                </span>
              ))}
            </span>
          ) : (
            text
          )}
        </span>
      )}
    </span>
  );
};

export default InfoTip;
