var express = require('express');
var http = require('http');
var session = require('express-session');
var request = require('request');


var app = express();
app.use(session({
    secret: process.env.sessionKEY,
    cookie: { maxAge: 60 * 1000 },
    resave: true,
    saveUninitialized: true
}));

var port = process.env.port || 1337;
app.use('/', express.static('static'));
app.get('/api/user', function (req, res) {
    var re;
    if (req.session.name)
        re = { statu: 'ok', name: req.session.name };
    else
        re = { statu: 'not login', url: 'https://www.facebook.com/v2.8/dialog/oauth?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code&scope=user_posts' };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(re));
});
app.get('/api/code', function (req, res) {
    request('https://graph.facebook.com/v2.8/oauth/access_token?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code' + '&client_secret=' + process.env.appKEY + '&code=' + req.query.code, function (error, response, body) {
        var userdata = JSON.parse(body);
        req.session.key = userdata.access_token;
        getUser(userdata.access_token).then(function (data) {
            req.session.name = data.name;
            req.session.fbid = data.id;
            res.redirect('../');
        });
    });
});

app.get('/api/post', function (req, res) {
    var url = 'https://graph.facebook.com/v2.8/me/posts?limit=100&access_token=' + req.session.key;
    getAllPosts(url,res);
});
http.createServer(app).listen(port);

function getUser(key) {
    return new Promise(function (resolve, reject) {
        request('https://graph.facebook.com/v2.8/me?fields=id%2Cname&access_token=' + key, function (error, response, body) {
            resolve(JSON.parse(body));
        });
    });
}
function getAllPosts(url, res) {
    var posts = [];
    getPost(url,posts).then(function (data) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data.posts));
    });
}
function getPost(url, posts) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {

            var data = JSON.parse(body);
            for (var d in data.data) {
                if (data.data[d].message)
                    posts.push(data.data[d].message);
            }
            if (posts.length < 500 && data.paging && data.paging.next)
                resolve(getPost(data.paging.next,posts));
            else
                resolve({posts: posts});
        });
    });
}
