// Shared peso formatting — customer money fields must show comma + ₱ + 2 decimals.
// Display-only: inputs keep digits+commas live, backend payloads stay raw numbers.

export const parseMoneyInput = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
  if (cleaned === '' || cleaned === '.' || cleaned === '-' || cleaned === '-.') return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

// Rendered money: ₱15,000.00 (always comma + peso sign + 2 decimals).
export const formatPeso = (value) => {
  const num = parseMoneyInput(value);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Live input masking: "15000" -> "15,000", "15000.5" -> "15,000.5".
// Preserves trailing dot while typing, caps decimals at 2.
export const formatMoneyInput = (raw) => {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(/[^0-9.]/g, '');
  if (s === '') return '';
  const firstDot = s.indexOf('.');
  let intPart = firstDot === -1 ? s : s.slice(0, firstDot);
  let decPart = firstDot === -1 ? null : s.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  const intFormatted = Number(intPart).toLocaleString('en-PH');
  if (decPart === null) return intFormatted;
  return `${intFormatted}.${decPart}`;
};

// On blur: finalize to 2 decimals for display (15000 -> 15,000.00).
export const finalizeMoneyInput = (raw) => {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (s === '') return '';
  const num = parseMoneyInput(s);
  return num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
