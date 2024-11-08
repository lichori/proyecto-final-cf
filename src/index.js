const express = require('express');
const app = express();
const db = require('./persistence');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');
const csvRoutes = require('./routes/csv');

app.use(express.json());
app.use(express.static(__dirname + '/static'));

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
