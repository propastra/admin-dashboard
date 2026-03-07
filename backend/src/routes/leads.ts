const express = require('express');
const router = express.Router();
const { LoginLead, WebsiteUser } = require('../models');
const auth = require('../middleware/auth');

// @route   GET /api/leads
// @desc    Get all website login leads
// @access  Private (Admin)
router.get('/', auth, async (req: any, res: any) => {
    try {
        const leads = await LoginLead.findAll({
            include: [{
                model: WebsiteUser,
                attributes: ['id', 'name', 'email', 'phone', 'city']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(leads);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
