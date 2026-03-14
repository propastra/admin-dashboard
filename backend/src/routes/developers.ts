const express = require('express');
const router = express.Router();
const { Developer, Property } = require('../models');

// Get all developers
router.get('/', async (req, res) => {
    try {
        const developers = await Developer.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: developers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get developer details including property count
router.get('/:id', async (req, res) => {
    try {
        const developer = await Developer.findByPk(req.params.id);
        if (!developer) {
            return res.status(404).json({ success: false, message: 'Developer not found' });
        }
        
        const count = await Property.count({ where: { developerId: developer.id } });
        
        res.json({ 
            success: true, 
            data: { 
                ...developer.toJSON(), 
                actualProjectsCount: count 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
