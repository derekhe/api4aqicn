var fs = require('fs'),
    _ = require('lodash'),
    request = require('request'),
    async = require('async'),
    keys = require('./keys'),
    moment = require('moment');

var tasks = {};
_.forEach(keys, function (n, key) {
    tasks[key] = function (callback) {
        request("http://mapidroid.aqicn.org/aqicn/json/android/" + n, function (err, response, body) {
            var data = JSON.parse(body);
            console.log(key, data);
            callback(err, data);
        })
    };
});

async.parallel(tasks, function (err, results) {
    console.log("All results", results);
    var path = "data/" + moment().format("YYYY_MM_DD_hh_mm_ss_ZZ") + ".json";
    fs.writeFileSync(path, JSON.stringify(results, null, 4));
});