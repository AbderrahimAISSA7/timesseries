const express = require('express');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const app = express();
const port = 3000;

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Paramètres de connexion à InfluxDB
const url = 'http://influxdb:8086';  // ou http://localhost:8086
const token = 'CSbnKe_ls4tYDgHvAcAEDimNYXtq9J5Wjc060a0kgtgkZjytNrCN-VLtT0GyU6-hAh1wadQwdkvGValZeI0o5A==';
const org = 'my-org';
const bucket = 'my-bucket';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns');  // Utilisation des nanosecondes comme précision pour les timestamps

// Route POST pour ajouter des données
app.post('/api/timeseries', (req, res) => {
    const { temperature, humidity, timestamp } = req.body;

    if (temperature === undefined || humidity === undefined || timestamp === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const point = new Point('weather')
            .floatField('temperature', temperature)
            .floatField('humidity', humidity)
            .timestamp(new Date(timestamp));

        writeApi.writePoint(point);
        writeApi.close().then(() => {
            console.log('Data written successfully');
            res.status(200).json({ message: 'Data added to InfluxDB' });
        }).catch(error => {
            console.error('Error writing data', error);
            res.status(500).json({ error: 'Failed to write data to InfluxDB' });
        });
    } catch (error) {
        console.error('Error processing request', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
