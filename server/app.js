#!/usr/bin/env node

var TabixServer = TabixServer || {};

var express = require('express');
var request = require('request');
var cors = require('cors');
var url = require('url');
var valid_url = require('valid-url');
var fs = require('fs');
var path = require('path');
var winston = require('winston');
var spawn = require('child_process').spawnSync;

TabixServer.App = express();

TabixServer.DefaultPort = 1234;

TabixServer.CurrentDir = process.cwd();

TabixServer.DatasetTypes = {
  SAMPLE: 'sample'
};

TabixServer.DatasetPaths = {
  SAMPLE : 'archives/sample.bed.gz'
};

TabixServer.Logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Console)({
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

TabixServer.App.use(cors())
TabixServer.App.get('/', function(req, res, next) {
  TabixServer.Logger.info(`request url: ${req.url} ${req.method}`);
  var requestCorrect = true;
  if (req.method == 'GET') {
    TabixServer.Logger.info("get returning query results");
    var query = url.parse(req.url, true).query;
    if (query.dataset) {
      TabixServer.Logger.info("query.dataset is set");
      if (query.dataset == TabixServer.DatasetTypes.SAMPLE) {
        TabixServer.Logger.info("query.dataset is sample");
        if (query.chr && query.start && query.stop) {
          TabixServer.Logger.info("query.dataset has chr, start, stop");
          var tabixArchive = path.join(TabixServer.CurrentDir, TabixServer.DatasetPaths.SAMPLE);
          var tabixROI = query.chr + ":" + query.start + "-" + query.stop;
          var child = spawn('tabix', [tabixArchive, tabixROI]);
          var tabixResult = child.stdout.toString().split("\n");
          tabixResult.pop();
          tabixResult = tabixResult.map((a) => a.split("\t"));
          res.write(JSON.stringify(tabixResult));
          res.end();
        } else {
          requestCorrect = false;
        }
      } else {
        res.sendStatus(404);
        return;
      }
    } else {
       requestCorrect = false;
    }
  } // if req.method == GET
  else {
    requestCorrect = false;
  }
  if (!requestCorrect) {
    res.sendStatus(400);
  }
});

TabixServer.App.get('/chromosomeList', function(req, res, next) {
  TabixServer.Logger.info(`query.chromosomeList`);
  var tabixArchive = path.join(TabixServer.CurrentDir, TabixServer.DatasetPaths.SAMPLE);
  var child = spawn('tabix', ['-l', tabixArchive]);
  var tabixResult = child.stdout.toString().split("\n");
  tabixResult.pop();
  tabixResult = tabixResult.sort((a, b) => a.localeCompare(b, 'en', {
    numeric: true
  }));
  res.write(JSON.stringify(tabixResult));
  res.end();
});

var http_port = TabixServer.NormalizePort(process.env.TABIX_SERVER_PORT || TabixServer.DefaultPort);

var http_server = TabixServer.App.listen(http_port, function() {
  TabixServer.Logger.info(`TabixServer is listening on port ${http_port}`)
});
