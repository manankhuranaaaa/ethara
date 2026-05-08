const express = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/stats', dashboardController.getStats);

module.exports = router;
