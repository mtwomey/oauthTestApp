const   {Router}      = require('express'),
        requireDir    = require('require-dir'),
        router        = Router(),
        controllers   = requireDir('./controllers'),
        config        = require('config');

router.get('/logs', controllers.LogsController.getAll);

router.get('/signals', controllers.SignalsController.getAll);

router.get('/loginUrl/:oauthTarget', controllers.Oauth2Controller.getLoginUrl);

router.get('/', (req, res) => {res.sendFile(__dirname + '/www/index.html');});

router.delete('/session', controllers.UtilController.clearSession);

router.get('/oauth2/callback', controllers.Oauth2Controller.callback);

router.get('/oauth2/configs', controllers.Oauth2Controller.getConfigs);

// This wildcard get-route goes last - if no other GETs match this one will serve static files
router.get('/*', controllers.StaticContentController.get);

module.exports = router;