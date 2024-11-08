const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: '/app/csvs/' });
const { exportToCsv, importFromCsv } = require('../persistence/mysql');

// Ruta para exportar datos a CSV
router.get('/export', async (req, res) => {
    try {
        const filePath = '/app/csvs/export.csv';
        await exportToCsv(filePath);
        res.download(filePath);
    } catch (err) {
        console.error('Error exporting data:', err); // Log the full error
        res.status(500).send('Error exporting data');
    }
});

// Ruta para importar datos desde CSV
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        await importFromCsv(filePath);
        res.send('Data imported successfully');
    } catch (err) {
        res.status(500).send('Error importing data');
    }
});

module.exports = router;