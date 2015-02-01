var fs = require('fs'),
    _ = require('lodash'),
    request = require('request'),
    async = require('async'),
    keys = require('./keys'),
    moment = require('moment'),
    argv = require('yargs').argv,
    archiver = require('archiver'),
    nodemailer = require('nodemailer');

var tasks = {};
_.forEach(keys, function (n, key) {
    tasks[key] = function (callback) {
        request("http://mapidroid.aqicn.org/aqicn/json/android/" + n, function (err, response, body) {
            var data = JSON.parse(body);
            if (argv.verbose) {
                console.log(key, data);
            }
            else {
                console.log("Got", key);
            }
            callback(err, data);
        })
    };
});

async.parallel(tasks, function (err, results) {
    if (argv.verbose) {
        console.log("All results", results);
    }
    else {
        console.log("Results count:" + _.size(results));
    }

    var jsonData = JSON.stringify(results, null, 4);

    var filenameBase = moment().format("YYYY_MM_DD_hh_mm_ss_ZZ");
    var zipFilePath = "data/" + filenameBase + ".zip";
    saveToZipFile(jsonData, zipFilePath, filenameBase);
    email(filenameBase, zipFilePath);
});

function saveToZipFile(jsonData, path, filenameBase) {
    var archive = archiver('zip');
    var output = fs.createWriteStream(path);

    archive.pipe(output);
    archive.append(jsonData, {name: filenameBase + ".json"});
    archive.finalize();
}

function email(filenameBase, filePath) {
    var cfg;
    try {
        cfg = require("./email");
    }
    catch (ex) {
        return;
    }

    console.log("Sending email");
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: cfg.user,
            pass: cfg.pass
        }
    });

    var mailOptions = {
        from: 'no-reply@gmail.com',
        to: cfg.to,
        subject: "[AQI]" + filenameBase,
        attachments: {
            filename: filenameBase + ".zip",
            path: filePath
        }
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
}