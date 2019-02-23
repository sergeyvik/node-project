let express = require('express');
let router = express.Router();
let xmlparse = require('../public/javascripts/xmlparse');
let mysqlFunc = require('../public/javascripts/mysqlFunctions');
let data;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/", function (req, res) {
    //console.log(req.headers['content-length']);
    //console.log(req.headers['content-type']);
    //res.statusCode = 200;

    data = xmlparse.xmlFileParse(req.files.fileXML.data.toString());

    mysqlFunc.masRecordsInBd("rating_id", "rating_name", "ratings", res => {
        //let ratingsInBd = mysqlFunc.ratingsRequest;
        let ratingsInFile = xmlparse.programsRatings(data);

        console.log(`masRecordsInBd`);
        console.log(res);
        //console.log(`ratingsInBd ${ratingsInBd}`);
        console.log(`ratingsInFile ${ratingsInFile}`);

        let ratingsForRecords = xmlparse.arrayForRecordInDb(ratingsInFile, res);
        //console.log(ratingsForRecords);

        mysqlFunc.lastIdInTable("rating_id", "ratings", res => {
            console.log(`Id ${res[0].id}`)
            console.log("dfgdhhdh");
            console.log(ratingsForRecords);
            for (let elem of ratingsForRecords) {
                elem = Number(elem);
            }
            mysqlFunc.recordInDirectoryDb("rating_id", "rating_name","ratings", ratingsForRecords, res[0].id);
            console.log(ratingsForRecords);
        })
    })


    //let test;
    //mysqlFunc.ratingsRequest((test) => {console.log(test);}) ;
    /*
    mysqlFunc.idColumnFromTable("rating_id", "ratings", test => {
        console.log(test);
        //console.log(mysqlFunc.lastIdInTable(test));
    });
    */
    //console.log(mysqlFunc.ratingsRequest);

    res.end();
});

module.exports = router;
