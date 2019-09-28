layui.define(['jquery', 'layer', 'ry_lib', 'layim', 'setter', 'sha1', 'contextmenu'], function (exports) {
    const $ = layui.jquery,
        lib = layui.ry_lib,
        layer = layui.layer,
        layim = layui.layim,
        sha1 = layui.sha1,
        setter = layui.setter,
        menu = layui.contextmenu;

    let conf = {
        uid: 0, //连接的用户id，必须传
        key: '', //融云key
        token: null,
    };

    const im = {
        getToken: function (data) {
            let headers = {}, nonce = Math.random().toString().slice(-10), timestamp = new Date().getTime();
            headers = {
                'App-Key': setter.app_key,
                'Nonce': nonce,
                'Timestamp': timestamp,
                'Signature': sha1(setter.app_secret + nonce + timestamp),
                "Content-Type": "application/x-www-form-urlencoded",
            };
            $.ajax({
                method: 'post'
                , url: '/api/user/getToken.json'
                , data: data
                , headers: headers
                , success: function (res) {
                    layer.closeAll();
                    layui.data('im', {
                        key: 'userInfo', value: {
                            userId: data.userId,
                            name: data.name,
                            portraitUri: data.portraitUri,
                            token: res.token
                        }
                    });
                    socket.config({
                        key: setter.app_key,
                        token: res.token,
                        user: data
                    })
                    layer.msg('登录成功', {icon: 1, time: 1000});
                }
            });
        },
        config: function (options) {
            conf = $.extend(conf, options);
            im.init(options.key);
            im.connectWithToken(options.token);
        },
        init: function (key) {
            lib.RongIMClient.init(key);
            this.initListener();    //初始化事件监听
            this.defineMessage();   //初始化自定义消息类型
        },
        initListener: function () { //初始化监听
            console.log('注册服务连接监听事件');
            RongIMClient.setConnectionStatusListener({
                onChanged: function (status) {
                    // status 标识当前连接状态
                    switch (status) {
                        case RongIMLib.ConnectionStatus.CONNECTED:
                            console.log('链接成功');
                            break;
                        case RongIMLib.ConnectionStatus.CONNECTING:
                            console.log('正在链接');
                            break;
                        case RongIMLib.ConnectionStatus.DISCONNECTED:
                            console.log('断开连接');
                            break;
                        case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
                            layer.msg('其他设备登录');
                            break;
                        case RongIMLib.ConnectionStatus.DOMAIN_INCORRECT:
                            layer.msg('域名不正确');
                            break;
                        case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
                            layer.msg('网络不可用');
                            break;
                    }
                }
            });


            RongIMClient.setOnReceiveMessageListener({
                onReceived: function (message) { // 接收到的消息
                    switch (message.messageType) { // 判断消息类型
                        case RongIMClient.MessageType.LAYIM_TEXT_MESSAGE:
                            layim.getMessage(message.content);
                            break;
                    }
                }
            });
        },
        connectWithToken: function (token) {    //连接事件
            RongIMClient.connect(token, {
                onSuccess: function (userId) {
                    im.initLayIm(userId); // 融云登录成功，初始化layim
                    $('#' + userId).text('已登录').addClass('layui-btn-disabled');
                    $('.login-btn').addClass('layui-btn-disabled');
                    layer.closeAll()
                },
                onTokenIncorrect: function (userId) {
                    layer.msg('token无效');
                },
                onError: function (errorCode) {
                    layer.msg('发送失败:' + errorCode);
                }
            });
        },
        //融云自定义消息，把消息格式定义为layim的消息类型
        defineMessage: function () {
            let defineMsg = function (obj) {
                RongIMClient.registerMessageType(obj.msgName, obj.objName, obj.msgTag, obj.msgProperties);
            };
            //注册普通消息
            let textMsg = {
                msgName: 'LAYIM_TEXT_MESSAGE',
                objName: 'LAYIM:CHAT',
                msgTag: new lib.MessageTag(false, false),
                msgProperties: ["username", "avatar", "id", "type", "content"]
            };
            //注册
            defineMsg(textMsg);
        },
        sendMsg: function (data) {
            let mine = data.mine, to = data.to, id = mine.id, group = to.type == 'group';
            if (group) {
                id = to.id;     //如果是group类型，id 就是当前 groupid，切记不可写成 mine.id 否则会出现一些问题。
            }
            //构造消息
            var msg = {
                username: mine.username
                , avatar: mine.avatar
                , id: id
                , type: to.type
                , content: mine.content
            };
            //这里要判断消息类型
            let conversationType = group ? lib.ConversationType.GROUP : lib.ConversationType.PRIVATE; //私聊,其他会话选择相应的消息类型即可。
            let targetId = to.id.toString();        //这里的targetId必须是string类型，否则会报错
            //构造消息体，这里就是我们刚才已经注册过的自定义消息
            console.log(msg);
            let detail = new RongIMClient.RegisterMessage.LAYIM_TEXT_MESSAGE(msg);
            //发送消息
            RongIMClient.getInstance().sendMessage(conversationType, targetId, detail, {
                onSuccess: function (message) {
                    console.log('发送消息成功');
                },
                onError: function (errorCode, message) {
                    console.log('发送失败:' + errorCode);
                }
            });
        },
        joinGroup: function (gid, groupName) {
            let groupId = (gid || '0').toString();  // 群 Id 。
            RongIMClient.getInstance().joinGroup(groupId, groupName, {
                onSuccess: function () {
                    console.log('加入群成功');
                },
                onError: function (error) {
                    console.log(error);
                }
            });
        },
        initLayIm: function (userId) {
            layim.config({
                init: {
                    url: './json/' + (userId).toLowerCase() + '-firends.json'
                    , type: 'get'
                    , data: {}
                }
                , members: {
                    url: '' //接口地址（返回的数据格式见下文）
                    , type: 'get' //默认get，一般可不填
                    , data: {} //额外参数
                }
                //上传图片接口（返回的数据格式见下文），若不开启图片上传，剔除该项即可
                , uploadImage: {
                    url: '' //接口地址
                    , type: 'post' //默认post
                }
                //上传文件接口（返回的数据格式见下文），若不开启文件上传，剔除该项即可
                , uploadFile: {
                    url: '' //接口地址
                    , type: 'post' //默认post
                }
                //扩展工具栏，下文会做进一步介绍（如果无需扩展，剔除该项即可）
                , tool: [{
                    alias: 'code' //工具别名
                    , title: '代码' //工具名称
                    , icon: '&#xe64e;' //工具图标，参考图标文档
                }]
                , msgbox: layui.cache.dir + 'css/modules/layim/html/msgbox.html' //消息盒子页面地址，若不开启，剔除该项即可
                , find: layui.cache.dir + 'css/modules/layim/html/find.html' //发现页面地址，若不开启，剔除该项即可
                , chatLog: layui.cache.dir + 'css/modules/layim/html/chatlog.html' //聊天记录页面地址，若不开启，剔除该项即可
            });


            layim.on('online', function (data) {
                console.log('在线状态' + data);
            });

            //监听签名修改
            layim.on('sign', function (value) {
                console.log(value);
            });

            //监听自定义工具栏点击，以添加代码为例
            layim.on('tool(code)', function (insert) {
                layer.prompt({
                    title: '插入代码'
                    , formType: 2
                    , shade: 0
                }, function (text, index) {
                    layer.close(index);
                    insert('[pre class=layui-code]' + text + '[/pre]');
                });
            });
            //监听layim建立就绪 init直接赋值mine、friend的情况下（只有设置了url才会执行 ready 事件）
            layim.on('ready', function (res) {
                layim.msgbox(5);
                // im.joinGroup('1', '海贼世界');  //加入融云群组
                menu.init([
                    {
                        target: '.layim-list-friend',
                        menu: [{
                            text: "新增分组",
                            callback: function (target) {
                                layer.msg(target.find('span').text());
                            }
                        }]
                    },
                    {
                        target: '.layim-list-friend >li>h5>span',
                        menu: [{
                            text: "重命名",
                            callback: function (target) {
                                layer.msg(target.find('span').text());
                            }
                        }, {
                            text: "删除分组",
                            callback: function (target) {
                                layer.msg(target.find('span').text());
                            }
                        }]
                    }
                ]);
            });

            //监听查看群员
            layim.on('members', function (data) {
                console.log('群成员' + data);
            });

            //监听聊天窗口的切换
            layim.on('chatChange', function (res) {
                var type = res.data.type;
                console.log(res.data.id)
                if (type === 'friend') {
                    //模拟标注好友状态
                    //layim.setChatStatus('<span style="color:#FF5722;">在线</span>');
                } else if (type === 'group') {
                    //模拟系统消息
//                        layim.getMessage({
//                            system: true
//                            , id: res.data.id
//                            , type: "group"
//                            , content: '模拟群员' + (Math.random() * 100 | 0) + '加入群聊'
//                        });
                }
            });
            layim.on('sendMessage', function (data) { //监听发送消息
                console.log(data);
                im.sendMsg(data);
            });
        },
    };


    exports('im', im);
});