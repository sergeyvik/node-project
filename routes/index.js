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
        //console.log(ratingData);
        let results2 = await mysqlFunc.query('SELECT category_id AS id, program_category AS cmp FROM categories', []);
        let categoryData = xmlparse.directoryObj(results2);
        //console.log(categoryData);
        for (let channel of data) {
            for (let program of channel.programs) {
                //console.log(program);
                //console.log(ratingData[program.program_rating]);
                //console.log(categoryData[program.program_category]);
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
        ' category_id, rating_id, program_description FROM programs WHERE channel_id<? AND program_start BETWEEN ? AND ?',
        [730, req.query.timeFrom, req.query.timeUntil]);
    let data = xmlparse.tablesToObject(results1, results2, results3, results4);
    res.json(data);
});

router.get('/channel', async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT rating_id AS id, program_rating AS cmp FROM ratings', []);
    let results2 = await mysqlFunc.query('SELECT category_id AS id, program_category AS cmp FROM categories', []);
    let results3 = await mysqlFunc.query('SELECT channel_id AS id, channel_name AS cmp, channel_icon AS icon FROM channels WHERE channel_id=?' , [req.query.id]);
    let results4 = await mysqlFunc.query('SELECT program_id, channel_id, program_name, program_start, program_end,' +
        ' category_id, rating_id, program_description FROM programs WHERE channel_id=? AND program_start BETWEEN ? AND ?',
        [req.query.id, req.query.startWeek, req.query.endWeek]);
    let data = xmlparse.tablesToObject(results1, results2, results3, results4);
    res.json(data);
});

router.get('/channelsData', async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT rating_id AS id, program_rating AS cmp FROM ratings', []);
    let results2 = await mysqlFunc.query('SELECT category_id AS id, program_category AS cmp FROM categories', []);
    let results3 = await mysqlFunc.query('SELECT channel_id AS id, channel_name AS cmp, channel_icon AS icon FROM channels', []);
    let results4 = await mysqlFunc.query('SELECT program_id, channel_id, program_name, program_start, program_end,' +
        ' category_id, rating_id, program_description FROM programs WHERE channel_id<? AND program_start BETWEEN ? AND ?' +
        'AND channel_id <> 237 AND channel_id <> 245 AND channel_id <> 246 AND channel_id <> 247 AND channel_id <> 304' +
        ' AND channel_id <> 446 AND channel_id <> 236 AND channel_id <> 242 AND channel_id <> 243 AND channel_id <> 244' +
        ' AND channel_id <> 274', [730, req.query.startWeek, req.query.endWeek]);
    let data = xmlparse.tablesToObject(results1, results2, results3, results4);
    res.json(data);
});

router.get('/userData', async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT user_id FROM users WHERE user_login=? AND user_password=?',
        [req.query.login, req.query.password]);
    let results2 = await mysqlFunc.query('SELECT channel_id, starred, hidden FROM users_channels WHERE user_id=?;',
        [results1[0].user_id]);
    let userData1 = [];
    for (let i = 0; i < results2.length; i++) {
        let data = {};
        data[results2[i].channel_id] = {};
        data[results2[i].channel_id].starred = results2[i].starred;
        data[results2[i].channel_id].hidden = results2[i].hidden;
        userData1.push(data);
    }
    let results3 = await mysqlFunc.query('SELECT reminder_id FROM users_reminders WHERE user_id=?', [results1[0].user_id]);
    let userData2 = {};
    for (let i = 0; i < results3.length; i++) {
        //let data = {};
        let [row] = await mysqlFunc.query('SELECT * FROM reminders WHERE reminder_id=?',
            [results3[i].reminder_id]);
        userData2[row.program_id] = {};
        userData2[row.program_id].reminder_id = row.reminder_id;
        userData2[row.program_id].reminder_time = row.reminder_time;
        userData2[row.program_id].reminder_text = row.reminder_text;
        userData2[row.program_id].reminder_type = row.reminder_type;
        //userData2.push(data);
    }
    res.json({userData1, userData2});
});

router.get('/hiddenON', async function(req, res, next) {
    let results1 = await mysqlFunc.query('INSERT INTO users_channels (channel_id, user_id, starred, hidden) VALUES' +
        ' (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hidden=?', [req.query.id, req.query.userId, 0, 1, 1]);
    res.json();
});

router.get('/hiddenOFF', async function(req, res, next) {
    let results1 = await mysqlFunc.query('UPDATE users_channels SET hidden=? WHERE channel_id=? AND user_id=?',
        [0, req.query.id, req.query.userId]);
    res.json();
});

router.get('/reminderON', async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT max(reminder_id) as id FROM reminders', []);
    let id = xmlparse.setId(results1);
    let results2 = await mysqlFunc.query('INSERT INTO reminders (reminder_id, program_id, reminder_time, reminder_text,' +
        ' reminder_type) VALUES (?, ?, ?, ?, ?)', [id, req.query.program_id, req.query.time, req.query.text, req.query.type]);
    let results3 = await mysqlFunc.query('INSERT INTO users_reminders (user_id, reminder_id) VALUE (?, ?)',
        [req.query.userId, id]);
    res.json(id);
});

router.get('/reminderOFF', async function(req, res, next) {
    /* let results1 = await mysqlFunc.query('DELETE FROM users_reminders WHERE user_id=? AND reminder_id=?',
        [req.query.userId, req.query.reminder_id]); */
    let results2 = await mysqlFunc.query('DELETE FROM reminders WHERE reminder_id=?',
        [req.query.reminder_id]);
    res.json();
});

router.get('/starredON', async function(req, res, next) {
    let results1 = await mysqlFunc.query('INSERT INTO users_channels (channel_id, user_id, starred, hidden) VALUES' +
        ' (?, ?, ?, ?) ON DUPLICATE KEY UPDATE starred=?', [req.query.id, req.query.userId, 1, 0, 1]);
    res.json();
});

router.get('/starredOFF', async function(req, res, next) {
    let results1 = await mysqlFunc.query('UPDATE users_channels SET starred=? WHERE channel_id=? AND user_id=?',
        [0, req.query.id, req.query.userId]);
    res.json();
});

router.get('/checkLogin', async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT user_login FROM users WHERE user_login=?', [req.query.login]);
    let busy;
    if (results1.length > 0) {
        busy = 1;
    } else {
        busy = 0;
    }
    res.json(busy);
});

router.get('/userRecord',  async function(req, res, next) {
    let results1 = await mysqlFunc.query('SELECT max(user_id) as id FROM users', []);
    let id = xmlparse.setId(results1);
    let results2 = await mysqlFunc.query('INSERT INTO users (user_id, user_name, user_login, user_password, user_mail,' +
        ' user_admin) VALUES (?, ?, ?, ?, ?, ?)', [id, req.query.name, req.query.login, req.query.password,
        req.query.email, 0]);
    res.json();
});

router.get('/test2', function(req, res, next) {
    mysqlFunc.lastIdInTable('rating_id', 'ratings', (results) => {
        res.json(results);
    });
});

module.exports = router;
