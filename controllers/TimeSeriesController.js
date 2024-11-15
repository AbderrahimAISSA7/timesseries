const { InfluxDB, Point } = require('@influxdata/influxdb-client');

// Configuration d'InfluxDB
const client = new InfluxDB({ url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN });
const writeApi = client.getWriteApi(process.env.INFLUX_ORG, process.env.INFLUX_BUCKET);
writeApi.useDefaultTags({ app: 'time-series-api' });
const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

// Créer un point de données
exports.createDataPoint = async (req, res) => {
  const { temperature, humidity, timestamp } = req.body;

  // Vérifiez les champs requis
  if (temperature === undefined || humidity === undefined || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields: temperature, humidity, or timestamp.' });
  }

  try {
    // Création du point
    const point = new Point('weather')
      .floatField('temperature', parseFloat(temperature))
      .floatField('humidity', parseFloat(humidity))
      .timestamp(new Date(timestamp)); // Assurez-vous que le timestamp est valide

    // Log du point
    console.log('Writing point:', point);

    // Écriture dans InfluxDB
    writeApi.writePoint(point);

    // Pas de fermeture immédiate de `writeApi` (il reste ouvert pour d'autres écritures)
    await writeApi.flush(); // Force l'envoi immédiat du point

    res.status(201).json({ message: 'Data point created successfully' });
  } catch (err) {
    console.error('Error writing data to InfluxDB:', err);
    res.status(500).json({ error: 'Failed to write data to InfluxDB.' });
  }
};

// Lire des points de données
exports.readData = async (req, res) => {
  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
    |> range(start: -1h) 
    |> filter(fn: (r) => r._measurement == "weather")
  `;

  try {
    const data = [];
    console.log('Executing query:', query);

    // Collect rows
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        console.log('Retrieved row:', o);
        data.push(o);
      },
      error(err) {
        console.error('Error querying data:', err);
        res.status(500).json({ error: 'Failed to read data from InfluxDB.' });
      },
      complete() {
        console.log('Query completed. Total rows:', data.length);
        res.status(200).json(data);
      },
    });
  } catch (err) {
    console.error('Error querying data:', err);
    res.status(500).json({ error: 'Failed to query data from InfluxDB.' });
  }
};

// Mettre à jour un point de données (non supporté)
exports.updateDataPoint = (req, res) => {
  res.status(501).json({ error: 'Update functionality is not supported in InfluxDB.' });
};

// Supprimer un point de données (non supporté)
exports.deleteDataPoint = (req, res) => {
  res.status(501).json({ error: 'Delete functionality is not supported in InfluxDB.' });
};
