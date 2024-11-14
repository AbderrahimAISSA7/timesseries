const express = require('express');
const router = express.Router();
const TimeSeriesController = require('../TimeSeriesController');

// Routes for time series data
router.post('/', TimeSeriesController.createDataPoint);
router.get('/', TimeSeriesController.readData);
router.put('/:timestamp', TimeSeriesController.updateDataPoint);
router.delete('/:timestamp', TimeSeriesController.deleteDataPoint);

module.exports = router;
