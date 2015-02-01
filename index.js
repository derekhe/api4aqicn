var fs = require('fs'),
    _ = require('lodash'),
    request = require('request'),
    async = require('async'),
    keys = require('./keys'),
    moment = require('moment'),
    argv = require('yargs').argv,
    archiver = require('archiver');

var tasks = {};
_.forEach(keys, function (n, key) {
    tasks[key] = function (callback) {
        request("http://mapidroid.aqicn.org/aqicn/json/android/" + n, function (err, response, body) {
            var data = JSON.parse(body);
            if (argv.verbose) {
                console.log(key, data);
            }
            else{
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
    else{
        console.log("Results count:" + _.size(results));
    }

    var jsonData = JSON.stringify(results, null, 4);

    saveToZipFile(jsonData);
});

function saveToZipFile(jsonData) {
    var filenameBase = moment().format("YYYY_MM_DD_hh_mm_ss_ZZ");

    var zipFilePath = "data/" + filenameBase + ".zip";

    var archive = archiver('zip');
    var output = fs.createWriteStream(zipFilePath);

    archive.pipe(output);
    archive.append(jsonData, {name: filenameBase + ".json"});
    archive.finalize();
}
