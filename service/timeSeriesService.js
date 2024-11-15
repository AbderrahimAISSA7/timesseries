const { InfluxDB, Point } = require('@influxdata/influxdb-client');

// Configuration d'InfluxDB
const url = 'http://influxdb:8086'; 
const token = 'oXi1DYPt11DvTWEOa5gYGNn_H1A4yYXTGa6Y1_FAAWlb5bUODWgIJuD0nC9f-fYvE63gevfUhYKzKcXhlRrPxw==';
const org = 'my-org';
const bucket = 'my-bucket';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns');
const queryApi = influxDB.getQueryApi(org);

async function createDataPoint({ temperature, humidity, timestamp }) {
    try {
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

        const point = new Point('weather')
            .floatField('temperature', parsedTemperature)
            .floatField('humidity', parsedHumidity)
            .timestamp(parsedTimestamp);

        console.log('Point to write:', point);
        writeApi.writePoint(point);
        await writeApi.flush();
        console.log('Data written successfully.');
    } catch (error) {
        console.error('Error writing data to InfluxDB:', error.message);
        throw error;
    }
}

async function readDataPoints() {
    const fluxQuery = `
        from(bucket: "${bucket}")
        |> range(start: -30d)
    `;

    const rows = [];
    console.log('Executing query:', fluxQuery);

    await queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            console.log('Retrieved row:', o);
            rows.push(o);
        },
        error(err) {
            throw new Error(`Error querying data: ${err.message}`);
        },
    });

    console.log('Query completed. Total rows:', rows.length);
    return rows;
}

async function updateDataPoint({ temperature, humidity, timestamp }) {
    try {
        const point = new Point('weather')
            .floatField('temperature', parseFloat(temperature))
            .floatField('humidity', parseFloat(humidity))
            .timestamp(new Date(timestamp));

        console.log('Point to update:', point);
        writeApi.writePoint(point);
        await writeApi.flush();
        console.log('Data updated successfully.');
    } catch (error) {
        console.error('Error updating data in InfluxDB:', error.message);
        throw error;
    }
}

async function deleteDataPoint({ timestamp }) {
    if (!timestamp) {
        throw new Error('Missing timestamp field');
    }

    console.error("InfluxDB ne prend pas en charge la suppression directe via l'API ou Flux.");
    throw new Error('Direct deletion of data in InfluxDB is not supported.');
}

module.exports = {
    createDataPoint,
    readDataPoints,
    updateDataPoint,
    deleteDataPoint,
};
