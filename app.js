const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const influx = require('@influxdata/influxdb-client');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
// Middleware pour traiter le JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware
app.use(bodyParser.json());

// InfluxDB configuration
const { InfluxDB, Point } = influx;
const client = new InfluxDB({ url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN });
const writeApi = client.getWriteApi(process.env.INFLUX_ORG, process.env.INFLUX_BUCKET);
writeApi.useDefaultTags({ app: 'time-series-api' });

// Routes
const timeSeriesRoutes = require('./controllers/routes/timeSeriesRoutes');
app.use('/api/timeseries', timeSeriesRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
