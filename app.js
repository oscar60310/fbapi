var express = require('express');
var http = require('http');
var session = require('express-session');
var request = require('request');
var app = express();

// session 用來儲存登入資料 Facebook username token 等
app.use(session({
    secret: process.env.sessionKEY,
    cookie: { maxAge: 10 * 60 * 1000 },
    resave: true,
    saveUninitialized: true
}));
// 通訊埠，放在 Azure 上會開啟預設 80 號，我們在 local server 先使用 1337
var port = process.env.port || 1337;
// 放靜態資源，也就是我們主要 html js 等等前端的東西
app.use('/', express.static('static'));
// GET user 回傳有沒有登入，沒有的話給 url 請前端把使用者導向登入畫面
app.get('/api/user', (req, res) => {
    var re;
    if (req.session.name)
        re = { statu: 'ok', name: req.session.name };
    else
        re = { statu: 'not login', url: 'https://www.facebook.com/v2.8/dialog/oauth?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code&scope=user_posts' };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(re));
});
// GET Facebook 登入後會帶入 code 參數回傳到這裡，我們要把 code 拿去換 token，並取得使用者名稱，登入完成後導向至首頁
app.get('/api/code', (req, res) => {
    request('https://graph.facebook.com/v2.8/oauth/access_token?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code' + '&client_secret=' + process.env.appKEY + '&code=' + req.query.code, (error, response, body) => {

        var userdata = JSON.parse(body);
        req.session.key = userdata.access_token;
        /*  */
        getUser(userdata.access_token).then((data) => {
            req.session.name = data.name;
            req.session.fbid = data.id;
            res.redirect('../');
        });
    });
});
// GET 取得 500 篇或全部文章
app.get('/api/post', (req, res) => {
    var url = 'https://graph.facebook.com/v2.8/me/posts?limit=25&access_token=' + req.session.key;
    getPost(url, []).then((data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data.posts));
    });
});
http.createServer(app).listen(port);
console.log('server started');
// 向 FB 要求使用者名稱和 ID
function getUser(key) {
    return new Promise((resolve, reject) => {
        request('https://graph.facebook.com/v2.8/me?fields=id%2Cname&access_token=' + key, (error, response, body) => {
            resolve(JSON.parse(body));
        });
    });
}


// 向 FB 要求文章，每次要求只有 25 篇
function getPost(url, posts) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {

            var posts_data = JSON.parse(body);
            for (var d in posts_data.data) {
                if (posts_data.data[d].message)
                    posts.push(posts_data.data[d].message);
            }
            if (posts.length < 500 && posts_data.paging && posts_data.paging.next)
                resolve(getPost(posts_data.paging.next, posts));
            else
                resolve({ posts: posts });
        });
    });
}


