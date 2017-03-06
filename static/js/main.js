check();
var gettingPost = false;
function check() {
    $.get('../api/user', function (data) {
        if (data.statu == 'ok') {
            $("#tit").html(data.name + '，你好！');
            $("#start").html('開始製作');
            $("#start").click(function () {
                if (!gettingPost) {
                    gettingPost = true;
                    $("#start").html('正在讀取資料...');
                    getPost();
                }
            });
        }
        else {
            $("#start").html('登入 Facebook');
            $("#start").click(function () {
                window.location = data.url;
            });
        }
    });
}
function getPost() {
    $.get('../api/post', function (data) {
        var s = '';
        for (var d in data) {
            s += data[d];
        }

        //console.log(data);
        var options = {
            workerUrl: '../js/wordfreq.worker.js'
        };
        // Initialize and run process() function
        var lis = '';
        var wordfreq = WordFreq(options).process(s, function (list) {
            // console.log the list returned in this callback.
            // console.log(list);
            for (var l in list) {
                list[l][1] *= (list[l][1] < 10) ? 10 : 1;
            }
            $("#post").removeClass('remove');


            // $('#start').addClass('remove');
            $('html, body').animate({
                scrollTop: $("#post").offset().top
            }, 500, function () {
                 WordCloud(document.getElementById('post'), { list: list });
            });
            $("#start").html('再試一次！');
            gettingPost = false;
        });

    });
}