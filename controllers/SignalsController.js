function getAll(req, res) {
    let signals = req.session.signals; // This is probably undefined the very first time it's called
    req.session.signals = [];
    res.json(signals);
}

module.exports = {
    getAll
};