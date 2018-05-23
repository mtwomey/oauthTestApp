module.exports = {
    oauthTargets: {
        'tc-simple-tenant': {
            oauthEndpoint:               'https://tc-simple-tenant.auth0.com',
            authorizePath:               '/authorize', // auth0 default
            tokenPath:                   '/oauth/token', // auth0 default
            audience:                    'https://simple.topcoder.com',
            scope:                       'openid profile email offline_access',
            clientId:                    'C7q8jpZfTtRRDc4n3os9lhbweec6Odlo',
            redirectUri:                 process.env.REDIRECT_URI,
            state:                       '123',
            clientSecret:                process.env.CLIENT_SECRET_TC_SIMLPE
        },
        'test-cresidtSuisse': {
            oauthEndpoint:               'https://topcoder-dev.auth0.com',
            authorizePath:               '/authorize', // auth0 default
            tokenPath:                   '/oauth/token', // auth0 default
            audience:                    'https://api.topcoder.com/',
            scope:                       'openid profile email offline_access',
            clientId:                    'JoWA7Y7acACM6df3ELrwJC0DmPBg1pJG',
            redirectUri:                 process.env.REDIRECT_URI,
            state:                       '123',
            clientSecret:                process.env.CLIENT_SECRET_TEST_CREDITSUISSE
        }
    },

    wwwDirectory: 'www'
};
