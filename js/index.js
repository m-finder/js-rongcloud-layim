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


    $(function () {
        let user_info = {}
        form.on('submit(submit)', function (data) {
            user_info = data.field;
            user_info.userId = user_info.name;
            im.getToken(user_info);
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