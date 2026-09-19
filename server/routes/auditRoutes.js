// routes/auditRoutes.js

const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/roleMiddleware");

// GET /api/audit
// Admin only - server-side paging (10/page) + search + filters + sorting
router.get("/", protect, admin, async (req, res) => {
    try {
        const {
            search,
            module,
            action,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Validate paging: 10 per page default, max 50.
        const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Whitelisted sortable fields (default newest-first).
        const SORTABLE = ['createdAt', 'module', 'action', 'role'];
        const sortField = SORTABLE.includes(sortBy) ? sortBy : 'createdAt';
        const sortDir = String(order).toLowerCase() === 'asc' ? 1 : -1;

        const query = {};
        if (module && module !== 'all') query.module = module;
        if (action && action !== 'all') query.action = action;

        // Server-side search: module / action / role scalars + the log
        // author's name/email via a bounded User ID lookup.
        const term = (search || '').trim();
        if (term) {
            const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const User = require("../models/Users");
            const matchedUsers = await User.find({
                $or: [{ fullName: rx }, { email: rx }]
            }).select('_id').lean();
            const or = [{ module: rx }, { action: rx }, { role: rx }];
            if (matchedUsers.length) {
                or.push({ user: { $in: matchedUsers.map((u) => u._id) } });
            }
            query.$or = or;
        }

        // Filtered total so pagination labels stay correct while searching.
        const total = await AuditLog.countDocuments(query);

        // Fetch only the requested page of logs
        const logs = await AuditLog.find(query)
            .populate('user', 'fullName email firstName lastName')
            .sort({ [sortField]: sortDir })
            .skip(skip)    // Skip previous pages
            .limit(limitNum); // Limit to page size

        res.status(200).json({
            success: true,
            total: total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            data: logs
        });

    } catch (error) {
        console.error("Audit Log Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve audit logs."
        });
    }
});

module.exports = router;