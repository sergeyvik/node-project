const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '498777',
    database: 'tvp_db',
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
};

let ratingsRequest = function(callback) {
    connection.query("SELECT rating_id, program_rating FROM ratings", function (error, results, fields) {
        let result = {};
        if(error) {
            throw error;
        } else {
            for (let elem of results) {
                let name = "";
                name += elem.program_rating;
                result[name] = elem.rating_id;
            }
            callback(result);
        }
    });
};

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
        request += `insert into ratings (rating_id, program_rating) values (${id}, "${elem}");`;
        id++;
    }
    connection.query(request, function (error, results, fields) {
        if(error) throw error;
        //console.log(JSON.stringify(results));
        //console.log(JSON.stringify(fields));
        callback(results);
    });
};

let categoriesRequest = function(callback) {
    connection.query("SELECT * FROM `category`", function (error, results, fields) {
        if(error) throw error;
        callback(results);
    });
};

let masRecordsInBd = function(columnName1, columnName2, tableName, callback) {
    connection.query(`SELECT ${columnName1}, ${columnName2} FROM ${tableName}`, function (error, results, fields) {
        let result = {};
        if(error) throw error;
        for (let elem of results) {
            result[elem[columnName2]] = elem[columnName1];
            //console.log(`${result[elem[columnName2]]}=${[elem[columnName2]]}`);
        }
        callback(result);
    });
};

let lastIdInTable = function(columnName, tableName, callback) {
    connection.query(`SELECT max(${columnName}) as id FROM ${tableName}`, function (error, results, fields) {
        if(error) throw error;
        callback(results);
    });
};

let recordInDirectoryDb = function(columnName1, columnName2, tableName, data, id) {
    let sql;
    let i;
    if (id === null) {
        i = 1;
    } else {
        i = id + 1;
    }
    for (let elem of data) {
        if (typeof elem === "number") {
            sql = `insert into ${tableName} (${columnName1}, ${columnName2}) values (${i}, ${elem});`;
        } else if (typeof elem === "string") {
            sql = `insert into ${tableName} (${columnName1}, ${columnName2}) values (${i}, "${elem}");`;
        }
        connection.query(sql, function (error, results, fields) {
            if (error) throw error;
        });
        i++;
    };
};

module.exports.ratingsRequest = ratingsRequest;
module.exports.ratingsRecord = ratingsRecord;
module.exports.categoriesRequest = categoriesRequest;

module.exports.idColumnFromTable = idColumnFromTable;

module.exports.masRecordsInBd = masRecordsInBd;
module.exports.lastIdInTable = lastIdInTable;
module.exports.recordInDirectoryDb = recordInDirectoryDb;
