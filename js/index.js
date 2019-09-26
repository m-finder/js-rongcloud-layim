layui.extend({
    setter: 'config',
    ry_lib: 'ry_lib',
    im: 'im',
}).define(['jquery', 'setter', 'ry_lib', 'im', 'layer', 'form', 'laytpl', 'sha1'], function (exports) {
    let $ = jquery = layui.jquery,
        setter = layui.setter,
        ry_lib = layui.ry_lib,
        im = layui.im,
        sha1 = layui.sha1,
        layer = layui.layer,
        form = layui.form,
        laytpl = layui.laytpl;

    const json = function (options) {
        let that = this, type = typeof data === 'function';

        options.data = options.data || {};
        options.headers = options.headers || {};

        return $.ajax($.extend({
            type: 'post'
            , dataType: 'json'
            , contentType: 'application/json;charset=UTF-8'
            , success: function (res) {
                if (res.status === 0) {
                    success && success(res);
                } else {
                    layer.msg(res.msg || res.code, {shift: 6});
                    options.error && options.error();
                }
            }
            , error: function (e, code) {
                layer.msg('请求异常，请重试', {shift: 6});
                options.error && options.error(e);
            }
        }, options));
    };

    const register = function (data) {
        console.log(data)
        let headers = {}, nonce = Math.random().toString().slice(-8), timestamp = Date.parse(new Date());
        headers = {
            'App-Key': setter.app_key,
            'Nonce': nonce,
            'Timestamp': timestamp,
            'Signature': sha1(setter.app_key + nonce + timestamp)
        };
        json({
            type:'post'
            , url: 'http://api-cn.ronghub.com/user/getToken.json'
            , data: data
            , headers: headers
            , done: function(res){
                layer.closeAll();
                layer.msg('操作成功', {icon: 1, time: 1000}, function () {
                    layui.index.render();
                });
            }
        });
    };

    $(function () {
        let user_info = {}
        form.on('submit(submit)', function (data) {
            user_info = data.field;
            user_info.userId = user_info.name;
            register(user_info)
            return false;
        });

        let local_data = layui.data('im');
        if (local_data === '{}' || local_data.token === undefined) {
            layer.open({
                type: 1
                , area: ['500px', '300px']
                , closeBtn: 0
                , title: '输入用户信息'
                , skin: 'layui-layer-prompt'
                , shade: 0.6
                , anim: 1
                , content: $('#user-form').html()
                , success(layero, index) {
                    form.render()
                }
            });
            return false;
        }
    });

    exports('index', {});
});