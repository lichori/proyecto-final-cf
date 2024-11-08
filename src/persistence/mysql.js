const waitPort = require('wait-port');
const fs = require('fs');
const mysql = require('mysql2');
const { parse: parseToCsv } = require('json2csv');
const { parse: parseFromCsv } = require('csv-parse/sync');

const {
    MYSQL_HOST: HOST,
    MYSQL_HOST_FILE: HOST_FILE,
    MYSQL_USER: USER,
    MYSQL_USER_FILE: USER_FILE,
    MYSQL_PASSWORD: PASSWORD,
    MYSQL_PASSWORD_FILE: PASSWORD_FILE,
    MYSQL_DB: DB,
    MYSQL_DB_FILE: DB_FILE,
} = process.env;

let pool;

// Initialize the database connection pool
async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE, 'utf8').trim() : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE, 'utf8').trim() : USER;
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE, 'utf8').trim() : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE, 'utf8').trim() : DB;

    await waitPort({
        host,
        port: 3306,
        timeout: 20000,
        waitForDns: true,
    });

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    return new Promise((acc, rej) => {
        pool.query(
            `CREATE TABLE IF NOT EXISTS todo_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                completed BOOLEAN
            ) DEFAULT CHARSET utf8mb4`,
            err => {
                if (err) return rej(err);
                console.log(`Connected to MySQL DB at host ${host}`);
                acc();
            },
        );
    });
}

// Ensure that pool is initialized
function ensurePool() {
    if (!pool) {
        throw new Error("Database connection pool has not been initialized.");
    }
}

async function teardown() {
    ensurePool(); // Check if pool exists before tearing down
    return new Promise((acc, rej) => {
        pool.end(err => {
            if (err) rej(err);
            else acc();
        });
    });
}

// CRUD operations
async function getItems() {
    ensurePool();
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items', (err, rows) => {
            if (err) return rej(err);
            acc(rows.map(item => ({
                ...item,
                completed: item.completed === 1,
            })));
        });
    });
}

async function getItem(id) {
    ensurePool();
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items WHERE id=?', [id], (err, rows) => {
            if (err) return rej(err);
            acc(rows.map(item => ({
                ...item,
                completed: item.completed === 1,
            }))[0]);
        });
    });
}

async function storeItem(item) {
    ensurePool();
    return new Promise((acc, rej) => {
        pool.query(
            'INSERT INTO todo_items (name, completed) VALUES (?, ?)',
            [item.name, item.completed ? 1 : 0],
            (err, results) => {
                if (err) return rej(err);
                // Obtiene el id autogenerado del resultado de la inserción
                const insertedId = results.insertId;
                acc(insertedId); // Devuelve el id insertado
            },
        );
    });
}


async function updateItem(id, item) {
    ensurePool();
    return new Promise((acc, rej) => {
        pool.query(
            'UPDATE todo_items SET name=?, completed=? WHERE id=?',
            [item.name, item.completed ? 1 : 0, id],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id) {
    ensurePool();
    return new Promise((acc, rej) => {
        pool.query('DELETE FROM todo_items WHERE id = ?', [id], err => {
            if (err) return rej(err);
            acc();
        });
    });
}

// Helper functions for CSV import/export
async function getAllItems() {
    return getItems();
}

async function replaceAllItems(items) {
    ensurePool();
    await new Promise((acc, rej) => {
        pool.query('DELETE FROM todo_items', err => {
            if (err) return rej(err);
            acc();
        });
    });

    for (const item of items) {
        await storeItem({
            id: item.id,
            name: item.name,
            completed: item.completed ? 1 : 0, // almacena `completed` como 1 o 0
        });
    }
}

async function exportToCsv(filePath) {
    ensurePool();
    const items = await getAllItems();
    const csv = parseToCsv(items);
    fs.writeFileSync(filePath, csv);
}

async function importFromCsv(filePath) {
    ensurePool();
    const data = fs.readFileSync(filePath, 'utf8');
    const items = parseFromCsv(data, { columns: true });

    // Convierte `completed` a booleano explícitamente
    const parsedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        completed: item.completed.toLowerCase() === 'true' || item.completed === '1', // convierte a booleano
    }));

    await replaceAllItems(parsedItems);
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
    exportToCsv,
    importFromCsv,
    getAllItems,
    replaceAllItems,
    pool,
};
