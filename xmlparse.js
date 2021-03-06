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
                let date = new Date(Date.UTC(program.program_start.slice(0, 4), program.program_start.slice(4, 6) - 1,
                    program.program_start.slice(6, 8), program.program_start.slice(8, 10),
                    program.program_start.slice(10, 12), program.program_start.slice(12, 14)));
                if (program.program_start.slice(15, 16) == "+") {
                    date.setMilliseconds(-1 * (Number(program.program_start.slice(16, 18))
                        + (Number(program.program_start.slice(18, 20)) == 0 ? 0 : Number(program.program_start.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                } else if (program.program_start.slice(15, 16) == "-") {
                    date.setMilliseconds((Number(program.program_start.slice(16, 18))
                        + (Number(program.program_start.slice(18, 20)) == 0 ? 0 : Number(program.program_start.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                }
                program.program_start = date.valueOf();
                date = new Date(Date.UTC(program.program_end.slice(0, 4), program.program_end.slice(4, 6) - 1,
                    program.program_end.slice(6, 8), program.program_end.slice(8, 10), program.program_end.slice(10, 12)));
                if (program.program_end.slice(15, 16) == "+") {
                    date.setMilliseconds(-1 * (Number(program.program_end.slice(16, 18))
                        + (Number(program.program_end.slice(18, 20)) == 0 ? 0 : Number(program.program_end.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
                } else if (program.program_end.slice(15, 16) == "-") {
                    date.setMilliseconds((Number(program.program_end.slice(16, 18))
                        + (Number(program.program_end.slice(18, 20)) == 0 ? 0 : Number(program.program_end.slice(18, 20) / 60 ))) * 60 * 60 * 1000);
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

let directoryObj = function(data) {
    let result = {};
    for (let channel of data) {
        result[channel.cmp] =channel.id;
    }
    return result;
};

let setId = function(id) {
    let i;
    if (id[0].id === null) {
        i = 1;
    } else {
        i = id[0].id + 1;
    }
    return i;
};

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

let prepareForRecord = function (fromFileData, fromBdData, id) {
    let objectResult = {};
    let i = id;
    if (fromFileData.length !== undefined) {
        let result = [];
        for (let i = 0; i < fromFileData.length; i++) {
            result.push(fromFileData[i]);
        }
        for (let elem of fromBdData) {
            if (result.indexOf(elem.cmp) > -1) {
                result.splice(result.indexOf(elem.cmp), 1);
            }
        }
        for (let elem of result) {
            objectResult[i] = elem;
            i++;
            }
        } else {
            for (let elem in fromFileData) {
                objectResult[elem] = fromFileData[elem];
            }
            for (let elem of fromBdData) {
                if (objectResult[elem.cmp]) {
                    delete objectResult[elem.cmp];
                }
            }
        }
    return objectResult;
};

let tablesToObject = function (ratings, categories, channels, programs) {
    let result = [];
    let intermediateObj = {};
    let ratingsObj = {};
    let categoriesObj = {};
    if (ratings.length > 0) {
        for (let rating of ratings) {
            ratingsObj[rating.id] = rating.cmp;
        }
    }
    if (categories.length > 0) {
        for (let category of categories) {
            categoriesObj[category.id] = category.cmp;
        }
    }
    if (channels.length > 0) {
        for (let channel of channels) {
            intermediateObj[channel.id] = {};
            intermediateObj[channel.id].channel_id = channel.id;
            intermediateObj[channel.id].channel_name = channel.cmp;
            intermediateObj[channel.id].channel_icon = channel.icon;
            intermediateObj[channel.id].programs = [];
        }
    }
    if (programs.length > 0) {
        for (let program of programs) {
            let pr = {};
            pr.program_id = program.program_id;
            pr.program_start = program.program_start;
            pr.program_end = program.program_end;
            pr.program_name = program.program_name;
            pr.program_category = categoriesObj[program.category_id]?categoriesObj[program.category_id]:null;
            pr.program_rating = ratingsObj[program.rating_id]?ratingsObj[program.rating_id]:null;
            pr.program_description = program.program_description;
            intermediateObj[program.channel_id].programs.push(pr);
        }
    }
    try {
        for (let elem in intermediateObj) {
            if (intermediateObj[elem].programs.length > 0) {
                result.push(intermediateObj[elem]);
            }
        }
        //fs.writeFileSync("test77.json", JSON.stringify(result, null, 2), "utf8");
    } catch (e) {
    }
    return result
};

module.exports.xmlFileParse = xmlFileParse;
module.exports.channelsIcons = channelsIcons;
module.exports.channelsObj = channelsObj;
module.exports.directoryObj = directoryObj;
module.exports.setId = setId;
module.exports.iconsNames = iconsNames;
module.exports.createIconFiles = createIconFiles;
module.exports.programsRatings = programsRatings;
module.exports.programsCategories = programsCategories;
module.exports.prepareForRecord = prepareForRecord;
module.exports.tablesToObject = tablesToObject;

