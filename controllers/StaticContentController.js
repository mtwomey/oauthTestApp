const   config        = require('config'),
        path          = require('path');

function get(req, res) {
    let filename = config.wwwDirectory + req.path;
    res.sendFile(path.resolve(__dirname + '/../' + filename), function(err){
        if (err){
            res.status(404).send('- 404 -');
            console.log('404: ' + filename);
        } else {
            console.log('200: ' + filename);
        }
    });
}

module.exports = {
    get
};