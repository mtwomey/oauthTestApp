const   express         = require('express'),
        bodyParser      = require("body-parser"),
        compression     = require('compression'),
        app             = express(),
        session         = require('express-session'),
        routes          = require('./routes');


app.use(compression());

app.use(bodyParser.json());

app.use(session({
    secret: 'secretSigningKey',
    resave: false,
    saveUninitialized: true,
    name: 'testCookie',
    cookie: { maxAge: 3600000, httpOnly: false } // Probably want secure: true in production (will only send the cookie back with https connections)
}));

// Make sure logs and signals array is always there
app.use((req, res, next) => {
    if (!req.session.logs) {req.session.logs = [];}
    if (!req.session.signals) {req.session.signals = [];}
    next();
});

// Debug session IDs
// app.use((req, res, next) => {
//     console.log(req.session.id);
//     next();
// });

app.use(routes);

let port = process.env.PORT || 3000;
let server = app.listen(port, function () {
    console.log(`Server started on port ${port}`);
});
