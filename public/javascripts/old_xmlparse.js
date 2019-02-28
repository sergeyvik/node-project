/*
var test = require('./test');
test(8);
*/
const parseXml = require('@rgrove/parse-xml');
let xmlFileParse = function(xmlFile) {
    let channels = [];
    let programs = [];
    let parsedXML = parseXml(xmlFile);

    for (const el of parsedXML['children'][0]['children']) {
        if (el.name === 'channel') {
            const channel = {};
            const children = {};
            for (const child of el.children) {
                children[child.name] = child;
            }
            channel.channel_id = el.attributes.id;
            channel.channel_icon = 'icon' in children ? children.icon.attributes.src : undefined;
            channel.channel_name = children['display-name'].children[0].text;
            channels.push(channel);
        } else if (el.name === 'programme') {
            const program = {};
            const children = {};
            for (const child of el.children) {
                children[child.name] = child;
            }
            program.channel_id = el.attributes.channel;
            program.program_start = el.attributes.start;
            program.program_end = el.attributes.stop;
            program.program_name = children['title'].children[0].text;
            program.program_description = children['desc'] ? children['desc'].children[0].text : undefined;
            program.program_category = children['category'] ? children['category'].children[0].text : undefined;
            programs.push(program);
        }
    }

    for (let channel of channels) {
        channel.channel_id = Number(channel.channel_id);
        channel.programs = [];
        for (let program of programs) {
            if (channel.channel_id == program.channel_id) {
                delete program.channel_id;
                let date = new Date(Date.UTC(program.program_start.slice(0, 4), program.program_start.slice(4, 6) - 1, program.program_start.slice(6, 8), program.program_start.slice(8, 10), program.program_start.slice(10, 12), program.program_start.slice(12, 14)));
                if (program.program_start.slice(15, 16) == "+") {
                    date.setMilliseconds(-1 * (Number(program.program_start.slice(16, 18)) + (Number(program.program_start.slice(18, 20)) == 0 ? 0 : Number(program.program_start.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                } else if (program.program_start.slice(15, 16) == "-") {
                    date.setMilliseconds((Number(program.program_start.slice(16, 18)) + (Number(program.program_start.slice(18, 20)) == 0 ? 0 : Number(program.program_start.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                }
                program.program_start = date.valueOf();
                date = new Date(Date.UTC(program.program_end.slice(0, 4), program.program_end.slice(4, 6) - 1, program.program_end.slice(6, 8), program.program_end.slice(8, 10), program.program_end.slice(10, 12)));
                if (program.program_end.slice(15, 16) == "+") {
                    date.setMilliseconds(-1 * (Number(program.program_end.slice(16, 18)) + (Number(program.program_end.slice(18, 20)) == 0 ? 0 : Number(program.program_end.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                } else if (program.program_end.slice(15, 16) == "-") {
                    date.setMilliseconds((Number(program.program_end.slice(16, 18)) + (Number(program.program_end.slice(18, 20)) == 0 ? 0 : Number(program.program_end.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                }
                program.program_end = date.valueOf();
                if (program.program_name.indexOf('(12+)') > -1) {
                    program.program_name = program.program_name.slice(0, program.program_name.indexOf('(12+)') - 1);
                    program.program_rating = 12;
                } else if (program.program_name.indexOf('(16+)') > -1) {
                    program.program_name = program.program_name.slice(0, program.program_name.indexOf('(16+)') - 1);
                    program.program_rating = 16;
                } else if (program.program_name.indexOf('(18+)') > -1) {
                    program.program_name = program.program_name.slice(0, program.program_name.indexOf('(18+)') - 1);
                    program.program_rating = 18;
                } else if (program.program_name.indexOf('(6+)') > -1) {
                    program.program_name = program.program_name.slice(0, program.program_name.indexOf('(6+)') - 1);
                    program.program_rating = 6;
                } else {
                    program.program_rating = 0;
                }
                channel.programs.push(program);
            }
        }
    }
    return channels;
};

let http = require('http');
let fs = require("fs");

let channelsObj = function(channels) {
    let result = {};
    for (let channel of channels) {
        result[channel.channel_name] = [];
        result[channel.channel_name][0] = channel.channel_id;
        if (channel.channel_icon) {
            result[channel.channel_name][1] = channel.channel_icon;
        }
    }
    return result;
};
/*
let programsObj = function(channels) {
    let result = {};
    for (let channel of channels) {
        for (let program of channel.programs) {
            result[program.program_name] = [];
            result[program.program_name][0] = channel.channel_id;
            result[program.program_name][1] = program["program_start"];
            result[program.program_name][2] = program["program_end"];
            if (program["category_id"]) {
                result[program.program_name][3] = program["category_id"];
            }
            if (program["rating_id"]) {
                result[program.program_name][4] = program["rating_id"];
            }
            if (program["program_description"]) {
                result[program.program_name][5] = program["program_description"];
            }
        }
    }
    return result;
};
*/
let channelsIcons = function(channels) {
    //let uploadDir = "../images/";
    let filesFullPath = [];
    for (let channel of channels) {
        if (channel.channel_icon && filesFullPath.indexOf(channel.channel_icon) === -1) {
            filesFullPath.push(channel.channel_icon);
        }
    }
    return filesFullPath;
};

let iconsNames = function(filesFullPath) {
    let filesNames = [];
    filesFullPath.forEach(function (fileFullPath) {
        let fileName = fileFullPath.slice(fileFullPath.lastIndexOf('/') + 1, fileFullPath.length);
        filesNames.push(fileName);
    });
    return filesNames;
};

let createIconFiles = function(filesFullPath, uploadDir) {
    filesFullPath.forEach(function (fileFullPath) {
        let fileName = fileFullPath.slice(fileFullPath.lastIndexOf('/') + 1, fileFullPath.length);
        let file = fs.createWriteStream(uploadDir + fileName);
        let request = http.get(fileFullPath, function (response) {
            response.pipe(file);
        });
        fs.writeFileSync(uploadDir + fileName, request, "utf8");
    });
};

let programsRatings = function(channels) {    //(channels, ratingsReq)
    let ratings = [];
    for (let channel of channels) {
        for (let program of channel.programs) {
            if (program.program_rating && ratings.indexOf(program.program_rating) === -1) {
                ratings.push(program.program_rating);
            }
        }
    }
    return ratings;
};

let programsCategories = function(channels) {
    let categories = [];
    for (let channel of channels) {
        for (let program of channel.programs) {
            if (program.program_category && categories.indexOf(program.program_category) === -1) {
                categories.push(program.program_category);
            }
        }
    }
    return categories;
};

let arrayForRecordInDb = function (array, object) {
    let result = [];
    for (let i = 0; i < array.length; i++) {
        result.push(array[i].toString());
    }
    for (let elem in object) {
        if (result.indexOf(elem) > -1) {
            result.splice(result.indexOf(elem), 1);
        }
    }
    return result;
};

let objectForRecordInDb = function (objFromFile, objFromBd) {
    let result = {};
    for (let elem in objFromFile) {
        if (objFromBd[elem] !== undefined) {

        } else {
            result[elem] = objFromFile[elem];
        }
    }
    return result;
};

module.exports.xmlFileParse = xmlFileParse;
module.exports.channelsIcons = channelsIcons;
module.exports.channelsObj = channelsObj;
//module.exports.programsObj = programsObj;
module.exports.iconsNames = iconsNames;
module.exports.createIconFiles = createIconFiles;
module.exports.programsRatings = programsRatings;
module.exports.programsCategories = programsCategories;
module.exports.arrayForRecordInDb = arrayForRecordInDb;
module.exports.objectForRecordInDb = objectForRecordInDb;
