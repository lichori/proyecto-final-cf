const db = require('../persistence');

module.exports = async (req, res) => {
    const item = {
        name: req.body.name,
        completed: false,
    };

    try {
        const id = await db.storeItem(item);
        res.send({ id, ...item });
    } catch (error) {
        console.error("Error storing item:", error);
        res.status(500).send({ error: "An error occurred while storing the item." });
    }
};
