const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '498777',
    database: 'tvp_db',
    port: 3308
});
connection.connect();

let tableContentObj = function(tableName, callback) {
    connection.query(`SELECT * FROM ${tableName}`, function (error, results, fields) {
        let result = {};
        if(error) throw error;
        if (tableName === "ratings") {
            for (let elem of results) {
                result[elem["program_rating"]] = elem["rating_id"];
            }
        } else if (tableName === "categories") {
            for (let elem of results) {
                result[elem["program_category"]] = elem["category_id"];
            }
        } else if (tableName === "channels") {
            for (let elem of results) {
                result[elem["channel_name"]] = [];
                result[elem["channel_name"]][0] = elem["channel_id"];
                if (elem["channel_icon"]) {
                    result[elem["channel_name"]][1] = elem["channel_icon"];
                }
            }
        } else if (tableName === "programs") {
            for (let elem of results) {
                result[elem["program_name"]] = [];
                result[elem["program_name"]][0] = elem["program_id"];
                result[elem["channel_name"]][1] = elem["channel_id"];
                result[elem["program_start"]][2] = elem["program_start"];
                result[elem["program_end"]][3] = elem["program_end"];
                if (elem["category_id"]) {
                    result[elem["category_id"]][4] = elem["category_id"];
                }
                if (elem["rating_id"]) {
                    result[elem["rating_id"]][5] = elem["rating_id"];
                }
                if (elem["program_description"]) {
                    result[elem["program_description"]][6] = elem["program_description"];
                }
            }
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

let query = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.query(sql,params, function(error, results, fields) {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

module.exports.tableContentObj = tableContentObj;
module.exports.lastIdInTable = lastIdInTable;
module.exports.query = query;
