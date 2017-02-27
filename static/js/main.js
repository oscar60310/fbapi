check();
var gettingPost = false;
function check() {
    $.get('../api/user', function (data) {
        if (data.statu == 'ok') {
            $("#start").html(data.name);
            $("#start").click(function () {
                if (!gettingPost) {
                    gettingPost = true;
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
            workerUrl: '../fb/js/wordfreq.worker.js'
        };
        // Initialize and run process() function
        var lis = '';
        var wordfreq = WordFreq(options).process(s, function (list) {
            // console.log the list returned in this callback.
            // console.log(list);
            for (var l in list) {
                list[l][1] *= (list[l][1] < 10) ? 10 : 1;
            }
            //$("#post").html(lis);
            WordCloud(document.getElementById('post'), { list: list });
            // $('#start').addClass('remove');
            $('html, body').animate({
                scrollTop: $("#post").offset().top
            }, 500);
            gettingPost = false;
        });

    });
}