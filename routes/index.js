var express = require('express');
var router = express.Router();
var xmlparse = require('../public/javascripts/xmlparse');
let mysqlFunc = require('../public/javascripts/mysqlFunctions');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/", function (req, res) {
    //console.log(req.headers['content-length']);
    //console.log(req.headers['content-type']);
    //res.statusCode = 200;

    //let data = xmlparse.xmlFileParse(req.files.fileXML.data.toString());
    //let ratings = xmlparse.channelsRatings(data, mysqlFunc.ratingsRequest);
    //let test;
    //mysqlFunc.ratingsRequest((test) => {console.log(test);}) ;
    mysqlFunc.idColumnFromTable("rating_id", "ratings", test => {
        console.log(test);
        //console.log(mysqlFunc.lastIdInTable(test));
    });
    //console.log(mysqlFunc.ratingsRequest);

    res.end();
});

module.exports = router;
