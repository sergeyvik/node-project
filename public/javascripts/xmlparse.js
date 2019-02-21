/*
var test = require('./test');
test(8);
*/
const parseXml = require('@rgrove/parse-xml');
let fs=require("fs");
let xmlparse = function(xmlfile) {
    //let data=fs.readFileSync(xmlfile, {encoding: 'utf-8'});
    let channels = [];
    let programs = [];
    let parsedXML = parseXml(xmlfile);

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
            const children = {}
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
        channel.channel_id = Number(channel.channel_id)
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
}

module.exports = xmlparse;
