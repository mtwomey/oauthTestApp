const   config            = require('config'),
        axios             = require('axios'),
        helper            = require('../common/helper'),
        CircularJSON      = require('circular-json');

function callback(req, res) {
    let oauthTarget = config.get('oauthTargets')[req.session.oauthTarget];
    let log = (message) => {req.session.logs.push({timestamp: new Date().getTime(), source: 'SERVER', message: message});};
    log(`Received callback to: "${req.originalUrl}"`);
    log(`Query details:\n${JSON.stringify(req.query, null, 4)}`);
    log(`Comparing the state values: "${req.session.oauthStateValue}" = "${req.query.state}" ?`);
    if ((req.session.oauthStateValue && req.query.state) && (req.session.oauthStateValue === req.query.state)) {
        log('State values are equal');
        log('Exchanging the one-time code for a JWT token');
        let postBody = {
            grant_type: 'authorization_code',
            client_id: oauthTarget.clientId,
            client_secret: oauthTarget.clientSecret,
            code: req.query.code,
            redirect_uri: oauthTarget.redirectUri
        };
        console.log(postBody);
        axios.post(`${oauthTarget.oauthEndpoint + oauthTarget.tokenPath}`, postBody)
            .then(response => {
                if (response.data.access_token){
                    log(`Received an Access token back, decoding:\n${helper.parseJwt(response.data.access_token) ? JSON.stringify(helper.parseJwt(response.data.access_token).header, null, 4) + "\n" + JSON.stringify(helper.parseJwt(response.data.access_token).body, null, 4) : "Error parsing Access token"}`);
                    req.session.loggedIn = true;
                }
                if (response.data.id_token){
                    log(`Received an ID token back, decoding:\n${helper.parseJwt(response.data.id_token) ? JSON.stringify(helper.parseJwt(response.data.id_token).header, null, 4) + "\n" + JSON.stringify(helper.parseJwt(response.data.id_token).body, null, 4) : "Error parsing ID token"}`);
                }
                if (response.data.refresh_token){
                    log(`Received a Refresh token as well, saving that on the server`)
                }
                // res.cookie('jwtToken', response.data.access_token, { maxAge: 900000, httpOnly: true });
                req.session.signals.push('CloseOauthWindow');
                res.send('Done');
            })
            .catch(err => {
                let data = CircularJSON.stringify(err.response.data, null, 2);
                log(data);
                res.send(data);
            })
    } else {
        log('State values don\'t match!!!');
        req.session.signals.push('CloseOauthWindow');
        res.json(req.query);
    }
}

function getLoginUrl(req, res){
    res.send(helper.getLoginUrl(req));
}

function getConfigs(req, res) {
    res.json(Object.keys(config.get('oauthTargets')));
}

function setOauthTarget(req, res) {
    let log = (message) => {req.session.logs.push({timestamp: new Date().getTime(), source: 'SERVER', message: message});};
    log(`Changing target oauth to ${req.body.oauthTarget}`);
    req.session.oauthTarget = req.body.oauthTarget;
    res.sendStatus(200);
}

module.exports = {
    callback,
    getConfigs,
    getLoginUrl,
    setOauthTarget
};