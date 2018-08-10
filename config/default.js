module.exports = {
    oauthTargets: {
        'tc-simple-tenant': {
            oauthEndpoint:               'https://tc-simple-tenant.auth0.com',
            authorizePath:               '/authorize?source=simple-tc-01',
            tokenPath:                   '/oauth/token', // auth0 default
            audience:                    'https://simple.topcoder.com',
            responseType:                'code',
            scope:                       'openid profile email offline_access',
            clientId:                    'C7q8jpZfTtRRDc4n3os9lhbweec6Odlo',
            redirectUri:                 process.env.REDIRECT_URI,
            clientSecret:                process.env.CLIENT_SECRET_TC_SIMLPE
        },
        'test-creditSuisse': {
            oauthEndpoint:               'https://topcoder-dev.auth0.com',
            authorizePath:               '/authorize?source=test-cs',
            tokenPath:                   '/oauth/token', // auth0 default
            audience:                    'https://api.topcoder.com/',
            responseType:                'code',
            scope:                       'openid profile email offline_access',
            clientId:                    'JoWA7Y7acACM6df3ELrwJC0DmPBg1pJG',
            redirectUri:                 process.env.REDIRECT_URI,
            clientSecret:                process.env.CLIENT_SECRET_TEST_CREDITSUISSE
        },
        'tc-prod': {
            oauthEndpoint:               'https://topcoder.auth0.com',
            authorizePath:               '/authorize?source=simple-tc-01',
            tokenPath:                   '/oauth/token', // auth0 default
            audience:                    'https://api.topcoder.com/v3/auth0/auth',
            responseType:                'code',
            scope:                       'openid profile email offline_access',
            clientId:                    '6ZwZEUo2ZK4c50aLPpgupeg5v2Ffxp9P',
            redirectUri:                 process.env.REDIRECT_URI,
            clientSecret:                process.env.CLIENT_SECRET_TC_PROD
        },
        'LocalSimpleSaml': {
            oauthEndpoint:               'https://topcoder-dev.auth0.com',
            authorizePath:               '/authorize?source=test-localsimplesaml',
            tokenPath:                   '/oauth/token', // auth0 default
            audience:                    'https://api.topcoder.com/',
            responseType:                'token',
            scope:                       'openid profile email offline_access',
            clientId:                    'TZCq0iW4gYJyFua1ekLkqTIZbOeV40lC',
            redirectUri:                 process.env.REDIRECT_URI,
            clientSecret:                process.env.CLIENT_SECRET_LOCALSIMPLESAML
        }
    },

    wwwDirectory: 'www'
};
