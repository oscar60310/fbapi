# Node js 文字雲課程討論
這是 MSP NodeJs 技術小聚的課後文件，有任何問題，歡迎前往[課程社團](https://www.facebook.com/groups/126283061232907/)詢問。
## 簡介
在這個專案中，我們會使用 NodeJS 讀取 Facebook 用戶的貼文，製作出文字雲的效果，開始之前，您必須裝好 NodeJs (6.9.1) 以及相關IDE，我們會以 [VS Code](https://code.visualstudio.com/) 來示範，沒有實際參與實體課程的朋友，我們會建議有初步的 Javascript 基礎。

這次的預計成果
![](https://i.imgur.com/e49d8Uy.png)


這篇文章目標在於讓各位了解 [Facebook Graph API](https://developers.facebook.com/docs/graph-api?locale=zh_TW) 認證程序，所以沒有使用 JS 的 SDK，若您對內容有任何建議，歡迎在下方留言或進入社團與我們交流。

若您對 Facebook Graph API 運作方式已經有初步了解，您可以直接前往[實作部分](#%E4%BD%BF%E7%94%A8-nodejs-%E5%AF%A6%E4%BD%9C%E6%8E%88%E6%AC%8A%E5%8F%8A%E5%8F%96%E5%BE%97%E8%B3%87%E6%96%99)。
## Facebook Graph API
### 測試工具
[官網介紹](https://developers.facebook.com/docs/graph-api?locale=zh_TW)，建議讀者在開始之前，可以先看看官方的書名文件，大部分都有中文支援而且寫得很清楚。

這個API是我們讀、寫用戶 Facebook 資料的主要方法，我們可以使用 [測試工具](https://developers.facebook.com/tools/explorer/145634995501895/) 來探索我們取得的資料，例如 ==me== 可以取得使用者的基本資訊，這個資料不需要相關權限，如下圖所示，回傳的資料為 JSON 格式。
![](https://i.imgur.com/JuNFNFQ.png)

在取得相關資料之前，我們必須得到使用者許可，對於程式來說，我們必須使用 ==存取權杖(token)== 來向 Facebook 要求資料。測試工具中最上方一長串文字就是了，在你拿到權杖後，可以把它貼到測試工具中來先看看資料格式，我們會很常使用到他。

### 存取權杖 Token
在上一段，我們提到了存取權杖，這裡我們就來解釋他到底是什麼。

你不會希望你的個人資料隨隨便便的讓任何開發者使用，所以 Facebook 有個授權機制，要存取個人 Facebook 資料不是那麼容易，我們必須要有存取權杖(以下會使用 token 來代表他)。

你可以想像 Token 為古時候的令牌，我們要到文件庫取得資料(使用者隱私資訊)時，我們必須向管理員 (facebook 伺服器) 出示，每個 token 能存取到到資料不一樣，取決於使用者的授權。

Token 和斯斯一樣有分好幾種，讀者可以到[官方文件](https://developers.facebook.com/docs/facebook-login/access-tokens)中看看，這裡就不再多解釋了，這篇範例會使用的是==用戶存取權杖==，用來取得用戶資料。

另外， token 是會過期的，有分成短期和長期，前者大概只有幾個小時的有效期間，長期的則可能有一個月的期限，但我們可以更新 token 來增加使用時間，直到用戶取消授權。在本篇範例中，我們只需要幾秒鐘的時間就好，因為我們不儲存使用者資料，所以不會做到換取 token 的步驟。

### 如何取得 Token
講了那麼多，這個令牌要怎麼取得呢？
其實我們可以很方便的使用==FB JavaScript SDK==在前端之取得資料，這樣就不需要管 Token 的事情了。但在本篇，為了讓大家了解認證流程，我們會使用 nodejs **手動** 進行認證，讓我們開始吧。
[官方文件：手動建立登入流程](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/v2.1)

![](https://i.imgur.com/6IVnWiq.png)

首先來看看流程圖，看起來很簡單吧，我們一步一步解釋，在這篇例子中，我們實作的是中間的**伺服器**，用戶端指的是網頁前端程式，很多服務的認證架構都是長這個樣子，這也是我們為什麼要手動實作而不使用 SDK 的原因。

## 使用 NodeJs 實作授權及取得資料
這篇主要在教學 NodeJS 部分，所以前端 javascript 部分我們不會解釋，但會說明運作流程。

在開始之前，請讀者前往[下載](https://github.com/oscar60310/fbapi/raw/master/node%20class/material.7z)課程檔案，裡面包還含了 npm 設定、VS code 設定、git 設定 及前端資源。
### 申請應用程式
我們必須有一組 Facebook 的 ID 和 金鑰 才能開始，請到[開發人員介面](https://developers.facebook.com/apps/)申請，並在設定中加入==網站==平台，網址設定為本機伺服器的網址
```
http://localhost:1337
```
關於申請開發人員網路上有許多說明，這邊就不多做解釋，若有問題歡迎再詢問。

### 1. 導向授權頁面
要取得別人的資料之前，我們得先問問他願不願意，我們得將用戶引導到授權頁面，這篇我們會由前端直接處理，導向
```
https://www.facebook.com/v2.8/dialog/oauth?
  client_id={app-id}
  &redirect_uri={redirect-uri}
  &scope={scope}
```
有三個參數要帶入
|名稱|說明|
|---|---|
|app-id|應用程式編號|
|redirect-urid|回呼網址，也就是 Facebook 該把 code 傳給誰。|
|scope|需要的權限，沒有要求的權限你是沒有辦法使用的喔，這個範例我們要`user_posts`這個權限，其他權限可以參考[權限列表](https://developers.facebook.com/docs/facebook-login/permissions/)|

>這邊要注意的是回呼網址必須在應用程式網域下喔，不然把使用者導向其他網頁就糟糕了。

例如，我們的應用程式授權頁面網址為
https://www.facebook.com/v2.8/dialog/oauth?client_id=1850607275217976&redirect_uri=https://nodec.azurewebsites.net/api/code&scope=user_posts

![](https://i.imgur.com/mFs0LfN.png)

接著使用者會看到這個頁面，她可以選擇同意或拒絕授權(但通常大家看都沒看就按下去了，對吧?)，不論結果如何，Facebook 都會將網頁導回給回呼網址，但拒絕的話就沒有 Code 帶入了。


上面的訊息使用使用該應用程式的開發人員登入才看的到，因為大部分的權限必須要申請批准，還沒批准前只有開發人員、測試人員才可以使用。

若使用者拒絕給予資料，你可以再次詢問，但絕對不可以直接導回授權頁面喔，不斷要求授權是會被檢舉的。
像這樣 ... Facebook 會將使用者導向這個頁面。
![](https://i.imgur.com/mdCXpc2.png)

#### Session
這邊插入一點點其他東西，剛剛一直提到我們必須要有 token 才有資格取得資料，但使用者登入後我們就馬上需要資料嗎，在這裡範例中，我們先讓使用者登入，再按下「開始製作」按鈕，才向伺服器發送要求。

那麼我們該把 token 存在哪裡呢? 一個方法是存在瀏覽器的 Cookie 中，Cookie 的運作方法很簡單，在網頁通訊中，沒一次的要求都是獨立的，我們必不知道你就是剛剛來的那個人，這時候我們可以和使用者(也就是各位的瀏覽器)達成協議，造訪我們的網站時，我們除了回應給你網站內容外，還另外給你一塊餅乾，你下次來的時候，再帶個這塊餅乾，我們~~幫你打八折~~就會記得你了！

但是，我們不能把 token 直接給你，Cookie 是存在客戶端的，所以很容易被竊取，於是我們給了你一組辨識碼，看到這組辨識碼後，我們在伺服器中找到對應的資料，這就是 Session 的運作原理。

好了，講了這邊麼多，我們先把程式趕上進度吧。
```javascript
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
http.createServer(app).listen(port);
console.log('server started');
```
這些內容在上次課程中都有介紹囉，這邊就不多做解釋了，唯一增加的地方在8到13行，裡面定義了 session 的加密字串，以及 cookie 的過期時間(餅乾過期的就不能吃了)，詳細設定可以到作者的 [GitHub](https://github.com/expressjs/session) 上看。

secret 是 session 的加密字串，我們不直接寫在 app.js 中(因為這會公開給大家看)，而是寫在環境變數中，打開 .vscode 下的==launch.json==檔案，在13行的地方可以看到下面的設定：
```javascript
"env": {
  "appID": "", // Facebook 應用程式 ID
  "appKEY": "", // Facebook 應用程式 密鑰
  "sessionKEY": "", // 加密字串
  "redirect": "http://localhost:1337"
}
```
其中 sessionKEY 對應到的就是 session 的 secret ， 您可以前往[這個網頁](http://passwordsgenerator.net/)產生256長度的密碼。
appID 和 appKEY 請各位自行輸入。


在開啟伺服器之前，讀者應該在專案目錄執行 npm install 來安裝套件，使用 VS Code 的讀者可以按下偵錯頁面的「啟動程式」。

按下 VScode debug 中的開始偵錯按鈕，前往任何瀏覽器輸入 [http://localhost:1337/](http://localhost:1337/)，就可以看到網頁頁面囉，只不過會按鈕卡在「連線中」的狀態。
![](https://i.imgur.com/ivl8YmD.png)

在 VSCode 中，你可以看到這個小框框，按下綠色圓圈箭頭就可以重新啟動測試伺服器囉。
![](https://i.imgur.com/aVswLN8.png)



#### api/user
這個專案我們總共有三個 API 端點要做，第一個就是檢查登入狀態啦，前端會在網頁載入完成之後，發送 GET 要求到這個網址，我們得回應用戶名稱(如果有的話)或授權網址(沒有資料的話)。

聽起來很複雜嗎? 來看看 Code 吧
```javascript
app.get('/api/user', (req, res) => {
    var re;
    if (req.session.name)
        re = { statu: 'ok', name: req.session.name };
    else
        re = { statu: 'not login', url: 'https://www.facebook.com/v2.8/dialog/oauth?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code&scope=user_posts' };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(re));
});
```
利用 express 建立 get route，接著我們檢查 session 中有沒有 name 資料，有的話就回傳，沒有的話就傳回授權網址。


### 2. 3. code 處理
若使用者同意授權，Facebook 會給我們 code，恭喜你能使用資料了！但這裡的 code 和 token 是不同的喔，他只有一個功用：拿去換 token ，隨然聽起來有點可憐但事實就是如此，這個 code 只有伺服器端可以使用，必須由客戶端(前端)傳送給伺服器，再由伺服器向 facebook 換取 token。在換取的時候，必須要提供 secret key 密鑰來證明身分。千萬千萬千萬不可以把金鑰傳給前端由瀏覽器直接發送要求，有了 secret key ，盜用者可以代表你的應用程式做任何事情。
```javascript
app.get('/api/code', (req, res) => {
    request('https://graph.facebook.com/v2.8/oauth/access_token?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code' + '&client_secret=' + process.env.appKEY + '&code=' + req.query.code, (error, response, body) => {
        var userdata = JSON.parse(body);
        req.session.key = userdata.access_token;
    });
});
```
我們裡用 request 套件來發送要求，正確的話 Facebook 就會回傳 acces_token ，這就是我們要的囉。

### 5. 取得使用者基本資料
拿到 token 後，我們得先做一件事情：取得使用者基本資料，取得方法很簡單，直接發送要求到 me 端點就可以了，這裡我們寫成 Promise 型式讓程式碼比較好看。
```javascript
// 向 FB 要求使用者名稱和 ID
function getUser(key) {
    return new Promise((resolve, reject) => {
        request('https://graph.facebook.com/v2.8/me?fields=id%2Cname&access_token=' + key, (error, response, body) => {
            resolve(JSON.parse(body));
        });
    });
}
```
接著我們把 ID 和 姓名 存到 session 中，在導回到首頁，這樣這個端點就完成了。
```javascript
// GET Facebook 登入後會帶入 code 參數回傳到這裡，我們要把 code 拿去換 token，並取得使用者名稱，登入完成後導向至首頁
app.get('/api/code', (req, res) => {
    request('https://graph.facebook.com/v2.8/oauth/access_token?client_id=' + process.env.appID + '&redirect_uri=' + process.env.redirect + '/api/code' + '&client_secret=' + process.env.appKEY + '&code=' + req.query.code, (error, response, body) => {
        var userdata = JSON.parse(body);
        req.session.key = userdata.access_token;
        getUser(userdata.access_token).then((data) => {
            req.session.name = data.name;
            req.session.fbid = data.id;
            res.redirect('../');
        });
    });
});
function getUser(key) {
    return new Promise((resolve, reject) => {
        request('https://graph.facebook.com/v2.8/me?fields=id%2Cname&access_token=' + key, (error, response, body) => {
            resolve(JSON.parse(body));
        });
    });
}
```

做到這裡，你應該可以登入囉！　剩下最後抓取文章的部分了。

>Code 只能使用一次，而且很快就過期囉，建議每次測試的時候都前往首頁重新要求 code 來使用。

### 使用者貼文資料
還記得我們可愛的[測試工具](https://developers.facebook.com/tools/explorer/)嗎?  
請按下**取得權杖** > **取得用戶存取權杖**，勾選 user_posts。
![](https://i.imgur.com/fukfIHv.png)
我們偷懶，所以把全部權限都勾了

接著試試看==me/posts==端點
![](https://i.imgur.com/7QyzHu4.png)
應該就可以看到你的文章囉，這邊有幾點需要注意：
1. 有些文章是沒有文字的，我們會在程式中略過這些文章
2. 這裡沒辦法顯示你的所有文章，但在最下方會有 paging.next 的網址，提示我們前往下一個分頁。
3. 這個權限能拿到的文章是所有的貼文，不論是否公開

```javascript
// GET 取得 500 篇或全部文章
app.get('/api/post', (req, res) => {
    var url = 'https://graph.facebook.com/v2.8/me/posts?limit=25&access_token=' + req.session.key;
    getPost(url, []).then((data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data.posts));
    });
});
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
```
做到這邊，我們就可以產出文字雲了，我們的工作只是把文章傳送給前端，剩下的事就由他幫我們處理囉。


### 驗證 token 必要性
我們其實略過了一個步驟，驗證 token，為什麼需要呢?

token 冒用：假設我們 Android 上實做一個登入 facebook 帳戶的應用程式，我們可以藉由 token 查看使用者 id 來判別登入者。這有一個很大的問題，攻擊者可以使用其他的應用程式生成 token，來偽造登入行為。
我們可以藉由查看 token 屬性，檢查 app id 是否相符
```
GET /debug_token?
  input_token={input-token}&amp;
  access_token={access-token}
```
這裡的 access_token 為應用程式存取權杖。

但在這個範例中，我們的 token 是直接由 Facebook API 取得的，所以比較沒有這個問題。

## 總結
看過這篇文章後，你應該對 Facebook Graph API 有更進一步的瞭解了，讀者可以前往 [範例 Github](https://github.com/oscar60310/fbapi) 看看完整程式，我們還有其他課程，若您有興趣，可以[前往報名](http://www.accupass.com/go/node)，或加入[課程社團](https://www.facebook.com/groups/126283061232907/) 一起討論！

第十一屆微軟學生大使　技術組　[蔡臻平](https://github.com/oscar60310)、[詹鈞婷](https://github.com/tingting0706)　撰寫



