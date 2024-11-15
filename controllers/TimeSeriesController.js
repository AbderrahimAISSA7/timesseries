const TimeSeriesService = require('../services/TimeSeriesService');

class TimeSeriesController {
    static async createTimeSeries(req, res) {
        const { temperature, humidity, timestamp } = req.body;

        if (!temperature || !humidity || !timestamp) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }

        try {
            await TimeSeriesService.addData({ temperature, humidity, timestamp });
            res.status(200).json({ message: 'Données ajoutées avec succès' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getTimeSeries(req, res) {
        try {
            const data = await TimeSeriesService.getData();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateTimeSeries(req, res) {
        const { temperature, humidity, timestamp } = req.body;

        if (!temperature || !humidity || !timestamp) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }

        try {
            await TimeSeriesService.updateData({ temperature, humidity, timestamp });
            res.status(200).json({ message: 'Données mises à jour avec succès' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteTimeSeries(req, res) {
        const { timestamp } = req.body;

        if (!timestamp) {
            return res.status(400).json({ error: 'Champ timestamp manquant' });
        }

        try {
            await TimeSeriesService.deleteData(timestamp);
            res.status(200).json({ message: 'Données supprimées avec succès' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TimeSeriesController;
