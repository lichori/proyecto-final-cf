const fs = require('fs');
const path = require('path');
const sqlite = require('../../src/persistence/sqlite');

const TEMP_DIR = path.join(__dirname, 'temp');

beforeAll(() => {
    try {
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }
    } catch (err) {
        console.error('Error setting up temporary directory:', err);
    }
});

afterAll(() => {
    try {
        if (fs.existsSync(TEMP_DIR)) {
            fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        }
    } catch (err) {
        console.error('Error cleaning up temporary directory:', err);
    }
});

test('it initializes correctly', async () => {
    const location = path.join(TEMP_DIR, 'todos.db');
    await sqlite.init(location);
    expect(fs.existsSync(location)).toBe(true);
});

test('it can store and retrieve items', async () => {
    const location = path.join(TEMP_DIR, 'todos.db');
    await sqlite.init(location);

    const item = { id: '1', name: 'Test item', completed: false };
    await sqlite.storeItem(item);

    const retrievedItem = await sqlite.getItem('1');
    expect(retrievedItem).toEqual(item);
});

test('it can update an existing item', async () => {
    const location = path.join(TEMP_DIR, 'todos.db');
    await sqlite.init(location);

    const item = { id: '1', name: 'Test item', completed: false };
    await sqlite.storeItem(item);

    const updatedItem = { ...item, completed: true };
    await sqlite.storeItem(updatedItem);

    const retrievedItem = await sqlite.getItem('1');
    expect(retrievedItem).toEqual(updatedItem);
});

test('it can remove an existing item', async () => {
    const location = path.join(TEMP_DIR, 'todos.db');
    await sqlite.init(location);

    const item = { id: '1', name: 'Test item', completed: false };
    await sqlite.storeItem(item);

    await sqlite.removeItem('1');

    const retrievedItem = await sqlite.getItem('1');
    expect(retrievedItem).toBeUndefined();
});

test('it can get a single item', async () => {
    const location = path.join(TEMP_DIR, 'todos.db');
    await sqlite.init(location);

    const item = { id: '1', name: 'Test item', completed: false };
    await sqlite.storeItem(item);

    const retrievedItem = await sqlite.getItem('1');
    expect(retrievedItem).toEqual(item);
});
