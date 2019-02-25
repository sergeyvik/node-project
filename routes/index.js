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
    data = xmlparse.xmlFileParse(req.files.fileXML.data.toString());

    let filesFullPath = xmlparse.channelsIcons(data);
    //Список иконок из файла, для сравнения со списком существующих иконок
    let filesNames = xmlparse.iconsNames(filesFullPath);
    xmlparse.writeIcons(filesFullPath, "public/images/");

    mysqlFunc.masRecordsInBd("rating_id", "program_rating", "ratings", res => {
        let ratingsInFile = xmlparse.programsRatings(data);
        let ratingsForRecords = xmlparse.arrayForRecordInDb(ratingsInFile, res);

        mysqlFunc.lastIdInTable("rating_id", "ratings", res => {
            for (let elem of ratingsForRecords) {
                elem = Number(elem);
            }
            mysqlFunc.recordInDirectoryDb("rating_id", "program_rating", "ratings", ratingsForRecords, res[0].id);
        });
    });

    mysqlFunc.masRecordsInBd("category_id", "program_category", "categories", res => {
        let categoriesInFile = xmlparse.programsCategories(data);
        let categoriesForRecords = xmlparse.arrayForRecordInDb(categoriesInFile, res);
        mysqlFunc.lastIdInTable("category_id", "categories", res => {
            mysqlFunc.recordInDirectoryDb("category_id", "program_category", "categories", categoriesForRecords, res[0].id);
        });
    });

    mysqlFunc.masRecordsInBd("channel_id", "channel_name", "channels", res => {
        let channelsInFiles = xmlparse.channelsData(data);
        console.log(channelsInFiles);
        console.log(res);
        let channelsForRecords = xmlparse.arrayForRecordInDb(channelsInFiles, res);
        mysqlFunc.recordChannels("channel_id", "channel_icon", "channel_name", "channels", channelsForRecords);
        console.log(channelsForRecords);

    });

    res.end();
});

module.exports = router;
