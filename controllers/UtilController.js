const helper = require('../common/helper');

function getLoginUrl(req, res){
    res.send(helper.getLoginUrl(req));
}

function clearSession(req, res) {
    req.session.destroy();
    res.sendStatus(200);
}

module.exports = {
    getLoginUrl,
    clearSession
};