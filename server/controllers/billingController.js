// controllers/billingController.js
// Unified billing transactions (pre-assessment payments + solar invoice payments),
// globally date-ordered + paged. Mirrors Admin/billing.jsx fetchTransactions mapping.
const mongoose = require('mongoose');
const PreAssessment = require('../models/PreAssessment');
const SolarInvoice = require('../models/SolarInvoice');
const Client = require('../models/Clients');
const User = require('../models/Users');
const Project = require('../models/Project');

const TXN_PAGE_SIZE = 10;
const TXN_MAX_LIMIT = 50;

const escapeTxnRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get merged billing transactions (Admin)
// @route   GET /api/billing/transactions
// @access  Private (Admin)
exports.getBillingTransactions = async (req, res) => {
  try {
    const { status, search, sortBy = 'date', order = 'desc', page = 1, limit = TXN_PAGE_SIZE } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(TXN_MAX_LIMIT, Math.max(1, parseInt(limit, 10) || TXN_PAGE_SIZE));
    // Comparator returns >0 => b first: (b - a) is newest-first.
    const dir = String(order).toLowerCase() === 'asc' ? -1 : 1;
    const byStatus = sortBy === 'status';

    const term = (search || '').trim();
    const rx = term ? new RegExp(escapeTxnRegex(term), 'i') : null;

    // Shared ID lookups for search (client names, projects).
    let searchClientIds = [];
    let searchProjectIds = [];
    if (rx) {
      const [clients, projects] = await Promise.all([
        Client.find({ $or: [{ contactFirstName: rx }, { contactLastName: rx }] }).select('_id').lean(),
        Project.find({ $or: [{ projectName: rx }, { projectReference: rx }] }).select('_id').lean()
      ]);
      searchClientIds = clients.map((c) => c._id);
      searchProjectIds = projects.map((p) => p._id);
    }

    // ---- Pre-assessment payments (invoiced + paid/verifying) ----
    const preQuery = {
      invoiceNumber: { $exists: true, $ne: null },
      paymentStatus: { $in: ['paid', 'for_verification'] }
    };
    if (status && status !== 'all') preQuery.paymentStatus = status;
    if (rx) {
      const or = [{ bookingReference: rx }, { invoiceNumber: rx }];
      if (searchClientIds.length) or.push({ clientId: { $in: searchClientIds } });
      preQuery.$and = [{ invoiceNumber: { $exists: true, $ne: null } }, { $or: or }];
      delete preQuery.invoiceNumber;
    }
    const preRows = await PreAssessment.find(preQuery)
      .select('bookingReference invoiceNumber assessmentFee paymentMethod paymentGateway paymentStatus confirmedAt bookedAt clientId receiptUrl receiptNumber')
      .lean();

    // ---- Solar invoice payments (paid/partial invoices, expanded per payment) ----
    const solarQuery = { paymentStatus: { $in: ['paid', 'partial'] } };
    if (status && status !== 'all') solarQuery.paymentStatus = status;
    if (rx) {
      const or = [{ invoiceNumber: rx }];
      if (searchClientIds.length) or.push({ clientId: { $in: searchClientIds } });
      if (searchProjectIds.length) or.push({ projectId: { $in: searchProjectIds } });
      solarQuery.$and = [{ paymentStatus: solarQuery.paymentStatus }, { $or: or }];
      delete solarQuery.paymentStatus;
    }
    const solarRows = await SolarInvoice.find(solarQuery)
      .select('invoiceNumber paymentStatus payments clientId projectId receiptUrl receiptNumber')
      .lean();

    // ---- Batch client names + photos + project names (no heavy populates) ----
    const clientIds = [...new Set([
      ...preRows.map((r) => r.clientId?.toString()).filter(Boolean),
      ...solarRows.map((r) => r.clientId?.toString()).filter(Boolean)
    ])];
    const projectIds = [...new Set(solarRows.map((r) => {
      const p = r.projectId;
      return (p && typeof p === 'object' ? p.toString() : p)?.toString();
    }).filter(Boolean))];
    const [clients, projects] = await Promise.all([
      clientIds.length ? Client.find({ _id: { $in: clientIds } })
        .select('contactFirstName contactLastName userId').lean() : [],
      projectIds.length ? Project.find({ _id: { $in: projectIds } })
        .select('projectName').lean() : []
    ]);
    const userIds = [...new Set(clients.map((c) => c.userId?.toString()).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select('photoURL').lean()
      : [];
    const photoByUser = {};
    users.forEach((u) => { photoByUser[u._id.toString()] = u.photoURL || null; });
    const clientById = {};
    clients.forEach((c) => {
      clientById[c._id.toString()] = {
        name: `${c.contactFirstName || ''} ${c.contactLastName || ''}`.trim() || 'N/A',
        firstName: c.contactFirstName || '',
        lastName: c.contactLastName || '',
        photoURL: (c.userId && photoByUser[c.userId.toString()]) || null
      };
    });
    const projectNameById = {};
    projects.forEach((p) => { projectNameById[p._id.toString()] = p.projectName; });

    // ---- Map to the client transaction shape + global date order ----
    const txns = [];
    preRows.forEach((a) => {
      const c = clientById[a.clientId?.toString()] || { name: 'N/A', firstName: '', lastName: '', photoURL: null };
      txns.push({
        id: a._id,
        type: 'Pre-Assessment',
        reference: a.bookingReference,
        invoiceNumber: a.invoiceNumber,
        amount: a.assessmentFee,
        method: a.paymentGateway === 'paymongo' ? 'PayMongo' : (a.paymentMethod || 'cash'),
        status: a.paymentStatus,
        date: a.confirmedAt || a.bookedAt,
        client: c.name,
        clientFirstName: c.firstName,
        clientLastName: c.lastName,
        clientPhotoURL: c.photoURL,
        gateway: a.paymentGateway,
        receiptUrl: a.receiptUrl,
        receiptNumber: a.receiptNumber
      });
    });
    solarRows.forEach((i) => {
      const c = clientById[i.clientId?.toString()] || { name: 'N/A', firstName: '', lastName: '', photoURL: null };
      const pid = (i.projectId && typeof i.projectId === 'object' ? i.projectId.toString() : i.projectId)?.toString();
      (i.payments || []).forEach((p) => {
        txns.push({
          id: p._id,
          type: 'Project Payment',
          reference: i.invoiceNumber,
          invoiceNumber: i.invoiceNumber,
          amount: p.amount,
          method: p.method,
          status: i.paymentStatus,
          date: p.date,
          client: c.name,
          clientFirstName: c.firstName,
          clientLastName: c.lastName,
          clientPhotoURL: c.photoURL,
          gateway: 'manual',
          projectName: pid ? projectNameById[pid] : undefined,
          projectId: pid,
          receiptUrl: i.receiptUrl,
          receiptNumber: i.receiptNumber
        });
      });
    });

    txns.sort((a, b) => {
      if (byStatus && a.status !== b.status) {
        return ((a.status || '').localeCompare(b.status || '')) * dir;
      }
      return (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) * dir;
    });
    const total = txns.length;
    const transactions = txns.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      transactions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      itemsPerPage: limitNum
    });

  } catch (error) {
    console.error('Get billing transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};
