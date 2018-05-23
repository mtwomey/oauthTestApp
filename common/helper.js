const   crypto            = require('crypto'),
        config            = require('config');

function getLoginUrl(req){
    req.session.oauthStateValue = generateStateValue();

    let oauthTarget = config.get('oauthTargets')[req.params.oauthTarget];

    return `${oauthTarget.oauthEndpoint + oauthTarget.authorizePath}?` +
           `audience=${oauthTarget.audience}&` +
           `scope=${oauthTarget.scope}&` +
           `response_type=code&` +
           `client_id=${oauthTarget.clientId}&` +
           `redirect_uri=${oauthTarget.redirectUri}&` +
           `state=${req.session.oauthStateValue}`;
}

// Generate nonce for use in oauth2 state parameter
function generateStateValue() {
    return crypto.randomBytes(20).toString('hex');
}

function atob(a) {
    return new Buffer(a, 'base64').toString('binary');
}

function btoa(b) {
    return new Buffer(b).toString('base64');
}

function parseJwt (token) {
    try {
        let tokenParts = token.split('.', 2).map(part => {
            let base64 = part.replace('-', '+').replace('_', '/');
            return JSON.parse(atob(base64));
        });
        return {header: tokenParts[0], body: tokenParts[1]};
    } catch (err){
        console.log(err);
        return null;
    }
}

module.exports = {
    getLoginUrl,
    parseJwt
};