const express = require('express');
const router = express.Router();
const TimeSeriesController = require('../controllers/TimeSeriesController');

// Route POST pour ajouter des données
router.post('/timeseries', TimeSeriesController.createTimeSeries);

// Route GET pour lire les données
router.get('/timeseries', TimeSeriesController.getTimeSeries);

// Route PUT pour mettre à jour les données
router.put('/timeseries', TimeSeriesController.updateTimeSeries);

// Route DELETE pour supprimer des données
router.delete('/timeseries', TimeSeriesController.deleteTimeSeries);

module.exports = router;
