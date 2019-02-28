const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '498777',
    database: 'tvp_test',
    port: 3308
});
connection.connect();

let masRecordsInBd = function(columnName1, columnName2, tableName, callback) {
    connection.query(`SELECT ${columnName1}, ${columnName2} FROM ${tableName}`, function (error, results, fields) {
        let result = {};
        if(error) throw error;
        for (let elem of results) {
            result[elem[columnName2]] = elem[columnName1];
        }
        callback(result);
    });
};

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
    }
};

let recordChannels = function(data) {
    let sql;
    for (let elem in data) {
        if (data[elem][1]) {
            sql = `insert into channels (channel_id, channel_name, channel_icon) values (?, ?, ?)`;
            connection.query(sql, [data[elem][0], elem, data[elem][1]], function (error, results, fields) {
                if (error) throw error;
            });
        } else {
            sql = `insert into channels (channel_id, channel_name) values (?, ?)`;
            connection.query(sql,[data[elem][0], elem], function (error, results, fields) {
                if (error) throw error;
            });
        }
    }
};

let requestPrograms = function(channelId, programName, programStart, callback) {
    let sql = `SELECT * FROM tvp_db.programs WHERE channel_id = ? AND program_start = ? AND program_name = ?`;
    //console.log(`sql`);
    //console.log(sql);
    connection.query(sql,[channelId, programStart, programName], function(error, results, fields) {
        //console.log(`Результат`);
        //console.log(results);
        if (error) throw error;
        callback(results);
    });
};

let recordPrograms = function(program_id, channel_id, program_name, program_start, program_end, category_id, rating_id, program_description) {
    let sql = `insert into programs (program_id, channel_id, program_name, program_start, program_end, category_id, rating_id, program_description) values (?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(sql, [program_id, channel_id, program_name, program_start, program_end, category_id, rating_id, program_description], function (error, results, fields) {
        if (error) throw error;
    });
};
/*
let recordPrograms = function(program_id, channel_id, program_name, program_start, program_end, category_id, rating_id, program_description) {
    let sql;
    if (program_description) {
        sql = `insert into programs (program_id, channel_id, program_name, program_start, program_end, category_id, rating_id, program_description) values (${program_id}, ${channel_id}, "${program_name}", ${program_start}, ${program_end}, ${category_id?category_id:null}, ${rating_id?rating_id:null}, "${program_description}");`;
    } else
        sql = `insert into programs (program_id, channel_id, program_name, program_start, program_end, category_id, rating_id) values (${program_id}, ${channel_id}, "${program_name}", ${program_start}, ${program_end}, ${category_id?category_id:null}, ${rating_id?rating_id:null});`;
    console.log(sql);
    connection.query(sql, function (error, results, fields) {
        if (error) throw error;
    });
};
*/

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

let queries = function(sql, data, id) {
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
module.exports.masRecordsInBd = masRecordsInBd;
module.exports.lastIdInTable = lastIdInTable;
module.exports.recordInDirectoryDb = recordInDirectoryDb;
module.exports.recordChannels = recordChannels;
module.exports.recordPrograms = recordPrograms;
module.exports.requestPrograms = requestPrograms;
module.exports.query = query;
