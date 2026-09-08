import React, { useState } from 'react';
import './InfoTip.css';

// Small "?" helper that shows a plain-words explanation on hover (web)
// and on tap (mobile). Use next to technical terms customers may not know.
// position: 'above' (default) or 'below' — use 'below' when the tip sits
// near a card top where an upward bubble would get clipped.
const InfoTip = ({ text, position = 'above' }) => {
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
          {text}
        </span>
      )}
    </span>
  );
};

export default InfoTip;
