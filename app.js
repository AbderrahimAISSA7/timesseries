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

// Route GET pour lire les données
app.get('/api/timeseries', async (req, res) => {
    const queryApi = influxDB.getQueryApi(org);
    const fluxQuery = `from(bucket: "${bucket}")
                        |> range(start: -1d)  // Récupérer les données des dernières 24h
                        |> filter(fn: (r) => r["_measurement"] == "weather")`;

    try {
        const rows = [];
        await queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                rows.push(o);
            },
            error(error) {
                console.error('Error executing query', error);
                res.status(500).json({ error: 'Failed to read data from InfluxDB' });
            },
            complete() {
                res.status(200).json(rows);
            }
        });
    } catch (error) {
        console.error('Error querying data', error);
        res.status(500).json({ error: 'Failed to query data from InfluxDB' });
    }
});

// Route PUT pour mettre à jour les données (ajout d'un nouveau point avec un timestamp différent)
app.put('/api/timeseries', (req, res) => {
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
            console.log('Data updated successfully');
            res.status(200).json({ message: 'Data updated in InfluxDB' });
        }).catch(error => {
            console.error('Error updating data', error);
            res.status(500).json({ error: 'Failed to update data in InfluxDB' });
        });
    } catch (error) {
        console.error('Error processing update', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route DELETE pour supprimer des données
app.delete('/api/timeseries', async (req, res) => {
    const { timestamp } = req.body;

    if (!timestamp) {
        return res.status(400).json({ error: 'Missing timestamp field' });
    }

    const queryApi = influxDB.getQueryApi(org);
    const fluxQuery = `from(bucket: "${bucket}")
                        |> range(start: -1d) 
                        |> filter(fn: (r) => r["_measurement"] == "weather" && r["timestamp"] == "${timestamp}")
                        |> delete()`;

    try {
        await queryApi.queryRows(fluxQuery, {
            error(error) {
                console.error('Error deleting data', error);
                res.status(500).json({ error: 'Failed to delete data from InfluxDB' });
            },
            complete() {
                res.status(200).json({ message: 'Data deleted successfully' });
            }
        });
    } catch (error) {
        console.error('Error executing delete query', error);
        res.status(500).json({ error: 'Failed to delete data from InfluxDB' });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
