var express = require('express')
var http = require('http')
var app = express()
var port = process.env.port || 1337;
app.use('/fb',express.static('static'));
http.createServer(app).listen(port);