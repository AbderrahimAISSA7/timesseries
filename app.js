const express = require('express');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const app = express();
const port = 3000;

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Paramètres de connexion à InfluxDB
const url = 'http://influxdb:8086'; // ou http://localhost:8086
const token = 'oXi1DYPt11DvTWEOa5gYGNn_H1A4yYXTGa6Y1_FAAWlb5bUODWgIJuD0nC9f-fYvE63gevfUhYKzKcXhlRrPxw==';
const org = 'my-org';
const bucket = 'my-bucket';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns'); // Utilisation des nanosecondes comme précision

app.post('/api/timeseries', (req, res) => {
    const { temperature, humidity, timestamp } = req.body;

    if (!temperature || !humidity || !timestamp) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Validation et parsing des données
        const parsedTemperature = parseFloat(temperature);
        const parsedHumidity = parseFloat(humidity);
        const parsedTimestamp = new Date(timestamp);

        if (isNaN(parsedTemperature) || isNaN(parsedHumidity)) {
            throw new Error('Temperature or humidity must be valid numbers');
        }
        if (isNaN(parsedTimestamp.getTime())) {
            throw new Error('Timestamp must be a valid date');
        }

        console.log('Parsed values:', { parsedTemperature, parsedHumidity, parsedTimestamp });

        // Création du point
        const point = new Point('weather')
            .floatField('temperature',Number(temperature) )
            .floatField('humidity', Number(humidity))
            .timestamp(parsedTimestamp);

        console.log('Point to write:', point);

        // Écriture dans InfluxDB
        writeApi.writePoint(point);
        writeApi.flush()
            .then(() => {
                console.log('Data written successfully.');
                res.status(200).json({ message: 'Data added to InfluxDB' });
            })
            .catch((error) => {
                console.error('Error flushing data to InfluxDB:', error.message);
                res.status(500).json({ error: 'Failed to write data to InfluxDB' });
            });
    } catch (error) {
        console.error('Error processing request:', error.message);
        res.status(400).json({ error: error.message });
    }
});

function parseTimestamp(timestamp) {
    if (!isNaN(timestamp)) {
        // Si le timestamp est un nombre
        return timestamp.toString().length === 13
            ? new Date(parseInt(timestamp)) // Millisecondes
            : new Date(parseInt(timestamp) / 1e6); // Nanosecondes
    } else {
        // Si le timestamp est une chaîne (ISO 8601)
        return new Date(timestamp);
    }
}


// Route GET pour lire les données
app.get('/api/timeseries', async (req, res) => {
    const queryApi = influxDB.getQueryApi(org);
    const fluxQuery = `from(bucket: "${bucket}")
                   |> range(start: -30d)`;



    try {
        const rows = [];
        console.log('Executing query:', fluxQuery); // Debug log

        await queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                console.log('Retrieved row:', o); // Debug log
                rows.push(o);
            },
            error(error) {
                console.error('Error executing query', error);
                res.status(500).json({ error: 'Failed to read data from InfluxDB' });
            },
            complete() {
                console.log('Query completed. Total rows:', rows.length); // Debug log
                res.status(200).json(rows);
            }
        });
    } catch (error) {
        console.error('Error querying data', error);
        res.status(500).json({ error: 'Failed to query data from InfluxDB' });
    }
});


// Route PUT pour ajouter ou mettre à jour des données
app.put('/api/timeseries', async (req, res) => {
    const { temperature, humidity, timestamp } = req.body;

    // Validation des champs
    if (!temperature || !humidity || !timestamp) {
        return res.status(400).json({ error: 'Missing required fields: temperature, humidity, or timestamp' });
    }

    try {
        console.log('Received data for update:', { temperature, humidity, timestamp });

        const point = new Point('weather')
            .floatField('temperature',Number(temperature) )
            .floatField('humidity', Number(humidity))
            .timestamp(new Date(timestamp));


        console.log('Point to write for update:', point);

        // Écrire le point dans InfluxDB
        writeApi.writePoint(point);
        writeApi.flush()
            .then(() => {
                console.log('Data updated successfully.');
                res.status(200).json({ message: 'Data updated successfully.' });
            })
            .catch((error) => {
                console.error('Error flushing data to InfluxDB:', error.message);
                res.status(500).json({ error: 'Failed to update data in InfluxDB.' });
            });
    } catch (error) {
        console.error('Error processing update request:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route DELETE pour supprimer des données
app.delete('/api/timeseries', async (req, res) => {
    const { timestamp } = req.body;

    if (!timestamp) {
        return res.status(400).json({ error: 'Missing timestamp field' });
    }

    console.error("InfluxDB ne prend pas en charge la suppression directe via l'API ou Flux.");
    res.status(501).json({ error: 'Direct deletion of data in InfluxDB is not supported.' });
});


// Fermeture de writeApi à la fin de l'application
process.on('SIGINT', () => {
    console.log('Closing writeApi...');
    writeApi
        .close()
        .then(() => {
            console.log('writeApi closed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error closing writeApi:', error);
            process.exit(1);
        });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
