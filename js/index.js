layui.extend({
    setter: 'config',
    ry_lib: 'ry_lib',
    im: 'im',
}).define(['jquery', 'setter', 'ry_lib', 'im', 'layer', 'form'], function (exports) {
    let $ = layui.jquery,
        setter = layui.setter,
        ry_lib = layui.ry_lib,
        im = layui.im,
        layer = layui.layer,
        form = layui.form;

    $(function () {
        const changeStatus = function (that) {
            that.text('已登录');
            $('.login-btn').addClass('layui-btn-disabled');
            console.log(that.length)
        };
        $('.login-btn').click(function () {
            let that = this
            $.get('./json/' + this.id + '-firends.json', function (res) {
                let user_info = res.data;
                // im.getToken(user_info);

                im.config({
                    key: setter.app_key,
                    token: res.data.mine.token,
                    user: res.data
                });

                layui.data('im', {key: 'userInfo', value: user_info});
                changeStatus($(that))
            })
        });
        let local_data = layui.data('im');
        if (local_data === '{}' || local_data.userInfo === undefined) {
           layer.msg('请选择一个用户登录');
            $('.login-btn').removeClass('layui-btn-disabled');
            return false;
        } else {
            im.config({
                key: setter.app_key,
                token: local_data.userInfo.mine.token,
                user: local_data.userInfo
            });
            changeStatus($('#' + (local_data.userInfo.mine.username).toLowerCase()))
        }
    });

    exports('index', {});
});