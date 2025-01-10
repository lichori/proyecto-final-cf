const db = require('../persistence');
const {v4 : uuid} = require('uuid');

let currentId = 1;

module.exports = async (req, res) => {
    const item = {
        id: currentId++,
        name: req.body.name,
        completed: false,
    };

    await db.storeItem(item);
    res.send(item);
};
