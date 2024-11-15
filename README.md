## TimeSeries - Documentation

### Description
Ce projet est une application Node.js avec Express qui permet de gérer des séries temporelles de données (comme des mesures de température et d'humidité) dans une base de données InfluxDB. Les données peuvent être ajoutées, consultées, mises à jour et supprimées via une API REST.

### Prérequis
Avant de commencer, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/) (v12 ou supérieur)
- [Docker](https://www.docker.com/) (si vous utilisez Docker pour déployer InfluxDB)
- InfluxDB (v2 ou supérieur)

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/AbderrahimAISSA7/timesseries.git
   cd timesseries

2. **Installer les dépendances**
   ```bash
   npm install

3. **Configurer le fichier .env Créez un fichier .env à la racine du projet avec les variables suivantes :**
   ```plaintext
   INFLUX_URL=http://localhost:8086
   INFLUX_TOKEN=ton_token_influxdb
   INFLUX_ORG=ton_organisation
   INFLUX_BUCKET=ton_bucket

4. **Lancer le serveur**
   ```bash
   Node app.js
- Le serveur sera lancé sur http://localhost:3000.

### Utilisation avec Docker (Optionnel)
Pour exécuter InfluxDB avec Docker, utilisez le fichier docker-compose.yml inclus dans le projet :
   ```bash
   docker-compose up -d
  
