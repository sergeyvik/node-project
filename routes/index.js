var express = require('express');
var router = express.Router();
var xmlparse = require('../public/javascripts/xmlparse');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/", function (req, res) {
    console.log(req.headers['content-length']);
    console.log(req.headers['content-type']);
    //res.statusCode = 200;
    res.end();
    let data = xmlparse(req.files.fileXML.data.toString());
    console.log(data.length);
});

module.exports = router;
