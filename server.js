"use strict";
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require("fs");
var file = "time.db";
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
var port = process.env.port || 1337;

var timeFormatString = 'YYYY-MM-DDTHH:MM:SS.SSS';

app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

db.serialize(function () {
    if (!exists) {
        db.run("CREATE TABLE time (username TEXT, ticket TEXT, start INTEGER)");
    }
});

app.post('/punch', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    var enterDate = new Date();
    db.serialize(function () {
        if (req.body == null || (req.body.user_name == null && req.body.text == null)) return res.end('Please provide valid parameters');
        if (req.body.user_name != null && req.body.text == null) return getRunningTimes(req.body.user_name, enterDate,res);
        db.get('SELECT username, ticket, start FROM time WHERE username=? AND ticket=?',[req.body.user_name,req.body.text], function (err, row) {
            if (err) throw err;
            if (row == null) {
                addNew(req,enterDate,res);
            } else {
                returnExisting(row, enterDate, res);
            }
        });
    });
}).listen(port);

function addNew(req,enterDate,res) {
    var stmt = db.prepare('INSERT into time (username,ticket,start) VALUES(?,?,?)');
    stmt.run([req.body.user_name, req.body.text, enterDate.getTime()]);
    stmt.finalize();
    res.end(req.body.text + ": started - " + enterDate);
}

function returnExisting(row,enterDate,res) {
    var stmt = db.prepare('DELETE FROM time WHERE username=? AND ticket=?');
    stmt.run([row.username, row.ticket]);
    stmt.finalize();
    res.end(row.ticket + ": " + getTimeDifference(new Date(row.start), enterDate));
}

function getRunningTimes(username, enterDate, res) {
    db.serialize(function () {
        db.all('SELECT username, ticket, start FROM time WHERE username=?', username, function (err, rows) {
            var output = "";
            for (var row of rows) {
                output += row.ticket + ": " + getTimeDifference(new Date(row.start), enterDate) + "\r\n";
            }
            res.end(output);
        });
    });
}

function getTimeDifference(timeStart, timeEnd) {
    var hourDiff = timeEnd - timeStart; //in ms
    var secDiff = hourDiff / 1000; //in s
    var minDiff = hourDiff / 60 / 1000; //in minutes
    var hDiff = hourDiff / 3600 / 1000; //in hours
    var humanReadable = {};
    humanReadable.hours = Math.floor(hDiff);
    humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
    humanReadable.seconds = Math.floor(secDiff - 60 * humanReadable.minutes);
    return humanReadable.hours + "h " + humanReadable.minutes + "m " + humanReadable.seconds + "s";
}