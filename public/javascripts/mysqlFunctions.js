const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '498777',
    database: 'tvp_test',
    port: 3308
});
connection.connect();
/*
connection.connect();

let query = connection.query("SELECT * FROM `ratings`", function (error, results, fields) {
    if(error) throw error;
    console.log(JSON.stringify(results));
    console.log(JSON.stringify(fields));
});
connection.end();
*/

let idColumnFromTable = function(columnName, tableName, callback) {
    connection.query(`SELECT ${columnName} FROM ${tableName}`, function (error, results, fields) {
        if(error) throw error;
        callback(results.map(x=>x[columnName]));
    });
}

let ratingsRequest = function(callback) {
    connection.query("SELECT rating_id, rating_name FROM ratings", function (error, results, fields) {
        if(error) throw error;
        //console.log(JSON.stringify(results));
        //console.log(JSON.stringify(fields));
        callback(results);
    });
}

let ratingsRecord = function(data, callback) {
    let id = 0;
    this.ratingsRequest((results) => {
        for (let elem of JSON.stringify(results)) {
            if (elem.rating_id > id) {
               id = elem.rating_id + 1;
            }
        }
    });
    let request = "";
    for (let elem of data) {
        request += `insert into ratings (rating_id, rating_name) values (${id}, "${elem}");`;
        id++;
    }
    connection.query(request, function (error, results, fields) {
        if(error) throw error;
        //console.log(JSON.stringify(results));
        //console.log(JSON.stringify(fields));
        callback(results);
    });
}

let categoriesRequest = function(callback) {
    connection.query("SELECT * FROM `category`", function (error, results, fields) {
        if(error) throw error;
        callback(results);
    });
}

let masRecordsInColumn = function(columnName, tableName, callback) {
    connection.query(`SELECT ${columnName} FROM ${tableName}`, function (error, results, fields) {
        if(error) throw error;
        callback(results.map(x=>x[columnName]));
    });
}

let lastIdInTable = function(columnName, tableName, callback) {
    connection.query(`SELECT max(${columnName}) as id FROM ${tableName}`, function (error, results, fields) {
        if(error) throw error;
        callback(results);
    });
}

module.exports.ratingsRequest = ratingsRequest;
module.exports.ratingsRecord = ratingsRecord;
module.exports.categoriesRequest = categoriesRequest;

module.exports.idColumnFromTable = idColumnFromTable;

module.exports.masRecordsInColumn = masRecordsInColumn;
module.exports.lastIdInTable = lastIdInTable;
