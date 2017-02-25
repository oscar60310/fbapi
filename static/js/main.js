check();
function check(){
    $.get('../api/user',function(data){
        if(data.statu == 'ok'){
            $("#start").html(data.name);
            $("#start").click(function(){
                getPost();
            });
        }
        else{
            $("#start").html('登入 Facebook');
            $("#start").click(function(){
                window.location = data.url;
            });
        }
    });
}
function getPost(){
    $.get('../api/post',function(data){
        var s = '';
        for(var d in data)
        {
            s += data[d] + "<br>";
        }
        $("#post").html(s);
        //console.log(data);
    });
}