// Shared plain-words helpers for customer-facing pages.
// Internal statuses (quoted, for_verification, initial_paid, ...) are
// translated into 4 everyday words: Pending / Ongoing / For checking / Done.

export const NEXT_STEPS = [
  { key: 'booked', title: 'Booked', desc: 'You booked — we confirm your schedule' },
  { key: 'visit', title: 'We visit', desc: 'Our engineer checks your roof' },
  { key: 'install', title: 'We install', desc: 'We set up your solar panels' },
  { key: 'power', title: 'Power on', desc: 'You start using solar power' },
];

// How many of the 4 steps are done (0–4). 4 means fully complete.
export const getNextStepsDone = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 4;
  if (['in_progress', 'initial_paid', 'full_paid', 'progress_paid'].includes(s)) return 2;
  if (s === 'approved') return 1;
  return 0;
};

// Technical status -> one of: Pending | Ongoing | For checking | Done.
// Already-plain words (Cancelled, Refunded, Overdue, Partial) pass through.
export const getCustomerStatusLabel = (status) => {
  const s = (status || '').toLowerCase();
  if (['paid', 'completed', 'refunded'].includes(s)) return 'Done';
  if (['for_verification', 'verifying', 'refund_pending'].includes(s)) return 'For checking';
  if (
    ['approved', 'scheduled', 'contacted', 'in_progress', 'initial_paid',
      'full_paid', 'progress_paid', 'partial', 'processing', 'overdue'].includes(s)
  ) return 'Ongoing';
  if (
    ['pending', 'pending_payment', 'quoted', 'failed', 'cancelled', 'no_refund'].includes(s)
  ) return 'Pending';
  if (!s) return 'Pending';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
};
