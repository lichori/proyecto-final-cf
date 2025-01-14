const express = require('express');
const promClient = require('prom-client');
const app = express();
const db = require('./persistence');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');
const csvRoutes = require('./routes/csv');

app.use(express.json());
app.use(express.static(__dirname + '/static'));

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default metrics collection
promClient.collectDefaultMetrics({ register });

// Create a custom metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 600],
});

// Register the custom metric
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request duration
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : '', code: res.statusCode });
  });
  next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/items', getItems);
app.post('/items', addItem);
app.put('/items/:id', updateItem);
app.delete('/items/:id', deleteItem);

// Use CSV routes
app.use('/csv', csvRoutes);

async function startApplication() {
    try {
        await db.init();
        console.log("Database initialized successfully.");
        app.listen(3000, () => console.log('Listening on port 3000'));
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        process.exit(1); // Exit if initialization fails
    }
}

startApplication();

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
