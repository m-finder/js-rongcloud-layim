layui.extend({
    setter: 'config',
    ry_lib: 'ry_lib',
    im: 'im',
    contextmenu: 'contextmenu'
}).define(['jquery', 'setter', 'ry_lib', 'im', 'layer', 'form'], function (exports) {
    let $ = layui.jquery,
        setter = layui.setter,
        ry_lib = layui.ry_lib,
        im = layui.im,
        layer = layui.layer,
        form = layui.form;

    $(function () {
        $('.login-btn').click(function () {
            let that = this;
            $('.login-btn').addClass('layui-btn-disabled');
            $.get('./json/' + this.id + '-firends.json', function (res) {
                // 请求 token，前端请求需 nginx 代理，不安全
                // https://support.rongcloud.cn/kb/NDU0
                // location /api/ {
                //     proxy_pass http://api-cn.ronghub.com/;
                // }
                // im.getToken(user_info);
                let data = {
                    key: setter.app_key,
                    token: res.data.mine.token,
                    userId: res.data.mine.id
                };
                layer.msg('加载中', {icon: 16,shade: 0.01});
                layui.data('im', {key: 'userInfo', value: data});
                im.config(data);
            })
        });

        let local_data = layui.data('im');
        if (local_data === '{}' || local_data.userInfo === undefined) {
            layer.msg('请选择一个用户登录');
            $('.login-btn').removeClass('layui-btn-disabled');
            return false;
        } else {
            layer.msg('加载中', {icon: 16, shade: 0.01});
            im.config({
                key: setter.app_key,
                token: local_data.userInfo.token,
                userId: local_data.userInfo.userId
            });
        }


    });

    exports('index', {});
});