let express = require('express');
let router = express.Router();
let xmlparse = require('../xmlparse');
let mysqlFunc = require('../mysqlFunctions');
let data;

let fs = require("fs");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post("/", function (req, res) {
    data = xmlparse.xmlFileParse(req.files.fileXML.data.toString());
    fs.writeFileSync("test49.json", JSON.stringify(data, null, 2), "utf8")
    let filesFullPath = xmlparse.channelsIcons(data);
    //Список иконок из файла, для сравнения со списком существующих иконок
    let filesNames = xmlparse.iconsNames(filesFullPath);
    xmlparse.createIconFiles(filesFullPath, "public/images/");

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
        let channelsInFiles = xmlparse.channelsObj(data);
        let channelsForRecords = xmlparse.objectForRecordInDb(channelsInFiles, res);
        console.log(channelsForRecords);
        mysqlFunc.recordChannels(channelsForRecords);
    });

    let id;
    let ratingData;
    let categoryData;
    let channelData;

    mysqlFunc.masRecordsInBd("rating_id", "program_rating", "ratings", res => {
        ratingData = res;
    });
    mysqlFunc.masRecordsInBd("category_id", "program_category", "categories", res => {
        categoryData = res;
    });
    mysqlFunc.masRecordsInBd("channel_id", "channel_name", "channels", res => {
        channelData = res;
    });
    mysqlFunc.lastIdInTable("program_id", "programs", res => {
        console.log(res);
        if (res[0].id === null) {
            id = 1;
        } else {
            id = res[0].id + 1;
        }
        for (let channel of data) {
            for (let program of channel.programs) {
                mysqlFunc.requestPrograms(channel.channel_id, program.program_name, program.program_start, res => {
                    if (res.length ===0) {
                        mysqlFunc.recordPrograms(id, channel.channel_id, program.program_name, program.program_start, program.program_end, categoryData[program.program_category], ratingData[program.program_rating], program.program_description);
                        id++;
                    }
                });
            }
        }
    });

    res.end();
});

router.get('/test', async function(req, res, next) {
    var results1 = await mysqlFunc.query('SELECT * FROM ratings LIMIT ?', [2]);
    var results2 = await mysqlFunc.query('SELECT * FROM programs LIMIT ?', [3]);
    res.json({results1, results2});
});

router.get('/test3',  function(req, res, next) {
    mysqlFunc.query('SELECT * FROM ratings LIMIT ?', [5]).then((results1) => {
        mysqlFunc.query('SELECT * FROM programs LIMIT ?', [5]).then((results2)=>{
            res.json({results1, results2});
        });
    });
});

router.get('/test2', function(req, res, next) {
    mysqlFunc.lastIdInTable('rating_id', 'ratings', (results) => {
        res.json(results);
    });
});

module.exports = router;
