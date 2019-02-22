const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '498777',
    database: 'tvp_test',
    port: 3308
});

/*
connection.connect();

let query = connection.query("SELECT * FROM `ratings`", function (error, results, fields) {
    if(error) throw error;
    console.log(JSON.stringify(results));
    console.log(JSON.stringify(fields));
});
connection.end();
*/

let ratingsRec = function(callback) {
    connection.connect();
    let result = connection.query("SELECT * FROM `ratings`", function (error, results, fields) {
        if(error) throw error;
        //console.log(JSON.stringify(results));
        //console.log(JSON.stringify(fields));
        callback(results);
    });
    connection.end();
}

let categoriesRec = function() {
    connection.connect();
    let result = connection.query("SELECT * FROM `category`", function (error, results, fields) {
        if(error) throw error;
        //console.log(JSON.stringify(results));
        //console.log(JSON.stringify(fields));
        callback(results);
    });
    connection.end();
}

module.exports.ratingsRec = ratingsRec;
module.exports.categoriesRec = categoriesRec;
