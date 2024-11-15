const express = require('express');
const TimeSeriesRoutes = require('./routes/TimeSeriesRoutes');  // Import des routes
const app = express();
const port = 3000;

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Utilisation des routes pour les séries temporelles
app.use('/api', TimeSeriesRoutes);

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
