process.env.NODE_ENV = 'production';
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const serverDir = 'C:\\Solaris\\server';
const env = fs.readFileSync(path.join(serverDir, '.env'), 'utf8');
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1]] = v;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const col = (n) => db.collection(n);

  console.log('=== MOST RECENT REJECTED PAYMENTS (adminRemarks mentions rejected) ===');
  const rejectedPre = await col('preassessments')
    .find({ adminRemarks: /rejected/i })
    .sort({ updatedAt: -1 })
    .limit(8)
    .toArray();
  rejectedPre.forEach((a) => {
    console.log(`  PRE  ${a.bookingReference}  assess=${a.assessmentStatus}  pay=${a.paymentStatus}  method=${a.paymentMethod}  invoiceNumber=${JSON.stringify(a.invoiceNumber)}  updated=${a.updatedAt}`);
    console.log(`        remarks: ${a.adminRemarks}`);
  });

  const rejectedInv = await col('solarinvoices')
    .find({ internalNotes: /rejected/i })
    .sort({ updatedAt: -1 })
    .limit(8)
    .toArray();
  rejectedInv.forEach((i) => {
    console.log(`  INV  ${i.invoiceNumber}  status=${i.status}  pay=${i.paymentStatus}  type=${i.invoiceType}  balance=${i.balance}  updated=${i.updatedAt}`);
  });

  console.log('\n=== pre-assessments MISSING invoiceNumber (auto-excluded from count) ===');
  const noInv = await col('preassessments').find({ invoiceNumber: null }).toArray();
  noInv.forEach((a) => console.log(`  ${a.bookingReference}  assess=${a.assessmentStatus}  pay=${a.paymentStatus}  invoiceNumber=${JSON.stringify(a.invoiceNumber)}`));
  console.log('  count:', noInv.length);

  console.log('\n=== all pre-assessments in pending_payment or pending pay status ===');
  const pend = await col('preassessments')
    .find({ $or: [{ paymentStatus: 'pending' }, { assessmentStatus: 'pending_payment' }] })
    .toArray();
  pend.forEach((a) => console.log(`  ${a.bookingReference}  assess=${a.assessmentStatus}  pay=${a.paymentStatus}  invoiceNumber=${JSON.stringify(a.invoiceNumber)}`));
  console.log('  count:', pend.length);

  await mongoose.disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
