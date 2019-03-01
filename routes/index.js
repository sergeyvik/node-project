let express = require('express');
let router = express.Router();
let xmlparse = require('../public/javascripts/xmlparse');
let mysqlFunc = require('../public/javascripts/mysqlFunctions');
let data;

let fs = require("fs");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/", function (req, res) {
    data = xmlparse.xmlFileParse(req.files.fileXML.data.toString());
    fs.writeFileSync("test49.json", JSON.stringify(data, null, 2), "utf8");
    let filesFullPath = xmlparse.channelsIcons(data);
    //Список иконок из файла, для сравнения со списком существующих иконок
    let filesNames = xmlparse.iconsNames(filesFullPath);
    xmlparse.createIconFiles(filesFullPath, "public/images/");

    mysqlFunc.query('SELECT rating_id, program_rating AS cmp FROM ratings', []).then((results1) => {
        let ratingsInFile = xmlparse.programsRatings(data);
        mysqlFunc.query('SELECT max(rating_id) as id FROM ratings', []).then((results2)=>{
            let id = xmlparse.setId(results2);
            let ratingsForRecords = xmlparse.prepareForRecord(ratingsInFile, results1, id);
            try {
                for (let value in ratingsForRecords) {
                    mysqlFunc.query('INSERT INTO ratings (rating_id, program_rating) values (?, ?)', [value,
                        ratingsForRecords[value]]).then((results3)=>{
                    });
                }
            }
            catch (err) {
            }
        });
    });

    mysqlFunc.query('SELECT category_id, program_category AS cmp FROM categories', []).then((results1) => {
        let categoriesInFile = xmlparse.programsCategories(data);
        mysqlFunc.query('SELECT max(category_id) as id FROM categories', []).then((results2)=>{
            let id = xmlparse.setId(results2);
            let categoriesForRecords = xmlparse.prepareForRecord(categoriesInFile, results1, id);
            try {
                for (let value in categoriesForRecords) {
                    mysqlFunc.query('INSERT INTO categories (category_id, program_category) values (?, ?)', [value,
                        categoriesForRecords[value]]).then((results3)=>{
                    });
                }
            }
            catch (err) {
            }
        });
    });

    mysqlFunc.query('SELECT channel_id, channel_name AS cmp, channel_icon FROM channels', []).then((results1) => {
        let channelsInFile = xmlparse.channelsObj(data);
        mysqlFunc.query('SELECT max(channel_id) as id FROM channels', []).then((results2)=>{
            let id = xmlparse.setId(results2);
            let channelsForRecords = xmlparse.prepareForRecord(channelsInFile, results1, id);
            try {
                for (let value in channelsForRecords) {
                    mysqlFunc.query('INSERT INTO channels (channel_id, channel_name, channel_icon) values (?, ?, ?)' +
                        ' ON DUPLICATE KEY UPDATE channel_name=?, channel_icon=?', [channelsForRecords[value][0],
                        value, channelsForRecords[value][1]?channelsForRecords[value][1]:null, value,
                        channelsForRecords[value][1]?channelsForRecords[value][1]:null]).then((results3)=>{
                    });
                }
            }
            catch (err) {
            }
        });
    });

    setTimeout(async function() {
        let results1 = await mysqlFunc.query('SELECT rating_id AS id, program_rating AS cmp FROM ratings', []);
        let ratingData = xmlparse.directoryObj(results1);
        console.log(ratingData);
        let results2 = await mysqlFunc.query('SELECT category_id AS id, program_category AS cmp FROM categories', []);
        let categoryData = xmlparse.directoryObj(results2);
        console.log(categoryData);
        for (let channel of data) {
            for (let program of channel.programs) {
                //console.log(program);
                console.log(ratingData[program.program_rating]);
                console.log(categoryData[program.program_category]);
                //process.stdout.write(".");
                await mysqlFunc.query('INSERT INTO programs (channel_id, program_name, program_start, program_end,' +
                    ' category_id, rating_id, program_description) VALUES (?, ?, ?, ?, ?, ?, ?)' +
                    ' ON DUPLICATE KEY UPDATE category_id=?, rating_id=?', [channel.channel_id, program.program_name,
                    program.program_start, program.program_end,
                    categoryData[program.program_category]?categoryData[program.program_category]:null,
                    ratingData[program.program_rating]?ratingData[program.program_rating]:null,
                    program.program_description?program.program_description:null,
                    categoryData[program.program_category]?categoryData[program.program_category]:null,
                    ratingData[program.program_rating]?ratingData[program.program_rating]:null,]);
            }
        }

    }, 5000);

    res.end();
});

router.get('/data', async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT rating_id AS id, program_rating AS cmp FROM ratings', []);
    let results2 = await mysqlFunc.query('SELECT category_id AS id, program_category AS cmp FROM categories', []);
    let results3 = await mysqlFunc.query('SELECT channel_id AS id, channel_name AS cmp, channel_icon AS icon FROM channels', []);
    let results4 = await mysqlFunc.query('SELECT program_id, channel_id, program_name, program_start, program_end,' +
        ' category_id, rating_id, program_description FROM programs WHERE program_start BETWEEN ? AND ?',
        [req.query.timeFrom, req.query.timeUntil]);
    let data = xmlparse.tablesToObject(results1, results2, results3, results4);
    res.json(data);
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
