const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const url = 'http://influxdb:8086'; // Adapter selon l'environnement
const token = 'PuVoQrUYN29g5njAyk9ozaIBAvFlsqCdfHmvP0NAfNrqLrDutJSlQ5HK9qt8NG5e--WDHQmMAJWyrvvZkGsSKw==';
const org = 'my-org';
const bucket = 'my-bucket';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns');
const queryApi = influxDB.getQueryApi(org);

class TimeSeriesService {
    // Ajouter un point de données dans InfluxDB
    static async addData({ temperature, humidity, timestamp }) {
        const point = new Point('weather')
            .floatField('temperature', temperature)
            .floatField('humidity', humidity)
            .timestamp(new Date(timestamp));

        writeApi.writePoint(point);
        await writeApi.close();
    }

    // Récupérer les données des dernières 24 heures depuis InfluxDB
    static async getData() {
        const fluxQuery = `from(bucket: "${bucket}")
                           |> range(start: -1d)
                           |> filter(fn: (r) => r["_measurement"] == "weather")`;

        const rows = [];
        await queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                rows.push(tableMeta.toObject(row));
            },
            error(error) {
                throw new Error(error);
            },
            complete() {
                console.log("Query completed");
            }
        });
        return rows;
    }

    // Mettre à jour un point de données (ajoute un nouveau point avec un nouveau timestamp)
    static async updateData({ temperature, humidity, timestamp }) {
        // InfluxDB ne permet pas directement la mise à jour d'un point existant.
        // Pour "mettre à jour", on ajoute un nouveau point avec les mêmes valeurs mais un nouveau timestamp.
        const point = new Point('weather')
            .floatField('temperature', temperature)
            .floatField('humidity', humidity)
            .timestamp(new Date(timestamp));

        writeApi.writePoint(point);
        await writeApi.close();
    }

    // Supprimer un point de données basé sur le timestamp
    static async deleteData(timestamp) {
        const fluxQuery = `from(bucket: "${bucket}")
                           |> range(start: -1d)
                           |> filter(fn: (r) => r["_measurement"] == "weather" and r["_time"] == "${new Date(timestamp).toISOString()}")`;

        const rows = [];
        await queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                rows.push(tableMeta.toObject(row));
            },
            error(error) {
                throw new Error('Error deleting data');
            },
            complete() {
                console.log('Data deleted successfully');
            }
        });
    }
}

module.exports = TimeSeriesService;
