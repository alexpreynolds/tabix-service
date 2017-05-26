#!/usr/bin/env node

var TabixClient = TabixClient || {};

var express = require('express');
var winston = require('winston');
var path = require('path');

TabixClient.App = express();

TabixClient.DefaultPort = 4567;

TabixClient.Logger = new (winston.Logger)({
    transports: [
	new (winston.transports.Console)({
	    json: false,
	    colorize: true,
	    timestamp: true
	})
    ]
});

TabixClient.NormalizePort = function(val) {
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

TabixClient.App.use(express.static(path.join(__dirname, 'public')));

var http_port = TabixClient.NormalizePort(process.env.TABIX_CLIENT_PORT || TabixClient.DefaultPort);

var http_server = TabixClient.App.listen(http_port, function() {
    TabixClient.Logger.info(`TabixClient is listening on port ${http_port}`)
});
