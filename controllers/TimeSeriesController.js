const { Point } = require('@influxdata/influxdb-client');
const { InfluxDB } = require('@influxdata/influxdb-client');

// Configuration d'InfluxDB
const client = new InfluxDB({ url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN });
const writeApi = client.getWriteApi(process.env.INFLUX_ORG, process.env.INFLUX_BUCKET);
writeApi.useDefaultTags({ app: 'time-series-api' });

const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

// Créer un point de données
exports.createDataPoint = (req, res) => {
  const { temperature, humidity, timestamp } = req.body;

  const point = new Point('weather')
    .floatField('temperature', temperature)
    .floatField('humidity', humidity)
    .timestamp(new Date(timestamp));

  writeApi.writePoint(point);
  writeApi
    .close()
    .then(() => {
      res.status(201).send('Data point created');
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
};

// Lire des points de données
exports.readData = (req, res) => {
  const query = `from(bucket: "${process.env.INFLUX_BUCKET}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "weather")`;
  
  queryApi
    .collectRows(query)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
};

// Mettre à jour un point de données
exports.updateDataPoint = (req, res) => {
  // InfluxDB doesn't have direct update functionality; this would require inserting a new point.
  res.status(501).send('Update functionality is not supported in InfluxDB');
};

// Supprimer un point de données
exports.deleteDataPoint = (req, res) => {
  // InfluxDB doesn't have direct delete functionality; this could involve filtering during retrieval.
  res.status(501).send('Delete functionality is not supported in InfluxDB');
};
