function getAll(req, res) {
    let logs = req.session.logs; // This is probably undefined the very first time it's called
    req.session.logs = [];
    res.json(logs);
}

module.exports = {
    getAll
};