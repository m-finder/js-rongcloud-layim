layui.define(['layer', 'element'], function (exports) {

    const $ = layui.jquery
        , layer = layui.layer
        , element = layui.element
        , device = layui.device()
        , stope = layui.stope;


    let defaults = {
        menu: [{
            text: "菜单一",
            callback: function (t) {
            }
        }, {
            text: "菜单二",
            callback: function (t) {
            }
        }],
        target: $('.layim-list-friend')
    };

    const menu = {
        init: function (options) {
            defaults = $.extend(defaults, options);
            this.menuClick(defaults);
        },
        hide: function () {
            layer.closeAll('tips');
        },
        menuClick: function (options) {
            let target = options.target;

            $(target).on('contextmenu', function (event) {
                if (event.target != this) return false;

                let lis = '';
                layui.each(options.menu, function (index, item) {
                    lis += '<li class="ui-context-menu-item"><a href="javascript:void(0);" ><span>' + item.text + '</span></a></li>';
                });

                let html = '<ul id="contextmenu">' + lis + '</ul>';
                layer.tips(html, target, {
                    tips: 1,
                    time: 0,
                    anim: 5,
                    fixed: true,
                    skin: "layui-box layui-layim-contextmenu",
                    success: function (layero, index) {
                        menu.menuChildrenClick(options, target);
                        const stopEvent = function (e) {
                            stope(e);
                        };
                        layero.off('mousedown', stopEvent).on('mousedown', stopEvent);
                    }
                });
            });

            $(document).off('mousedown', menu.hide).on('mousedown', menu.hide);
        },
        menuChildrenClick: function (options, target) {
            $(document).on("click", ".ui-context-menu-item", function (event) {
                console.log(this)
                // layer.closeAll('tips');
                // target.menu[e].callback && target.menu[e].callback(options, $(this));
            });
        }
    };

    exports('contextmenu', menu);
});
