#!/usr/bin/env node

var TabixServer = TabixServer || {};

var express = require('express');
var request = require('request');
var url = require('url');
var valid_url = require('valid-url');
var fs = require('fs');
var path = require('path');
var winston = require('winston');
var child_process = require('child_process');

TabixServer.App = express();

TabixServer.DefaultPort = 1234;

TabixServer.CurrentDir = process.cwd();

TabixServer.DatasetTypes = {
    SAMPLE : 'sample'
};

TabixServer.DatasetPaths = {
    SAMPLE : 'archives/sample.bed.gz'
};

TabixServer.Logger = new (winston.Logger)({
    transports: [
	new (winston.transports.Console)({
	    json: false,
	    colorize: true,
	    timestamp: true
	})
    ]
});

TabixServer.NormalizePort = function(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
};

TabixServer.App.use('/', function(req, res, next) {
    TabixServer.Logger.info(`request url: ${req.url}`);
    var requestCorrect = true;
    if (req.method == 'GET') {
	var query = url.parse(req.url, true).query;
	var queryStr = JSON.stringify(query);
	TabixServer.Logger.info(`request query: ${queryStr}`);
	if (query.dataset) {
	    if (query.dataset == TabixServer.DatasetTypes.SAMPLE) {
		if (query.chr && query.start && query.stop) {
		    res.writeHead(200, {
			"Content-Type": "text/plain",
			"Cache-control": "no-cache",
			"Access-Control-Allow-Origin": "*",
		    });
		    var tabixArchive = path.join(TabixServer.CurrentDir, TabixServer.DatasetPaths.SAMPLE);
		    var tabixROI = query.chr + ":" + query.start + "-" + query.stop;
		    var tabixQuery = child_process.spawn('tabix', [tabixArchive, tabixROI]);
		    var tabixResult = "";

		    tabixQuery.stdout.pipe(res);

		    tabixQuery.stderr.on('data', function(data) {
			TabixServer.Logger.error(`${data}`);
			res.end('stderr: ' + data);
		    });
		}
		else {
		    requestCorrect = false;
		}
	    }
	    else {
		res.sendStatus(404);
		return;
	    }
	}
	else {
	    requestCorrect = false;
	}
    }
    else {
	requestCorrect = false;
    }
    if (!requestCorrect) {
	res.sendStatus(400);
    }
});

var http_port = TabixServer.NormalizePort(process.env.TABIX_SERVER_PORT || TabixServer.DefaultPort);

var http_server = TabixServer.App.listen(http_port, function() {
    TabixServer.Logger.info(`TabixServer is listening on port ${http_port}`)
});
