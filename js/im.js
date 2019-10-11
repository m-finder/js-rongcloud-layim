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
                    });
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
            this.initListener();    //初始化连接状态监听
            this.defineMessage();   //初始化自定义消息类型
        },
        initListener: function () { //连接状态监听器
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
                            console.log(message.content)
                            layim.getMessage(message.content);
                            break;
                        case RongIMClient.MessageType.LAYIM_TEXT_NOTICE:
                            // layim.getMessage(message.content);
                            console.log('--------------')
                            console.log(message.content)
                            console.log('--------------')
                            console.log(message.content.category)
                            console.log(message.content.category == 'online')
                            if (message.content.category == 'online') {
                                layim.setFriendStatus(message.content.id, 'online');
                                console.log(message.content.id, '上线了')
                            }
                            break;
                        default:
                            console.log('未定义消息');
                            console.log(message);
                            break;
                    }
                }
            });
        },
        connectWithToken: function (token) {    //连接事件
            RongIMClient.connect(token, {
                onSuccess: function (userId) {
                    console.log('融云登录成功，初始化layim， userid：' + userId);
                    im.initLayIm(userId);
                    $('#' + userId).text('已登录').addClass('layui-btn-disabled');
                    $('.login-btn').addClass('layui-btn-disabled');
                    layer.closeAll()
                },
                onTokenIncorrect: function () {
                    layer.msg('token无效');
                },
                onError: function (errorCode) {
                    let info = '';
                    switch (errorCode) {
                        case RongIMLib.ErrorCode.TIMEOUT:
                            info = '超时';
                            break;
                        case RongIMLib.ConnectionState.UNACCEPTABLE_PAROTOCOL_VERSION:
                            info = '不可接受的协议版本';
                            break;
                        case RongIMLib.ConnectionState.IDENTIFIER_REJECTED:
                            info = 'appkey不正确';
                            break;
                        case RongIMLib.ConnectionState.SERVER_UNAVAILABLE:
                            info = '服务器不可用';
                            break;
                    }
                    layer.msg(info)
                }
            });
        },
        //融云自定义消息，把消息格式定义为layim的消息类型
        defineMessage: function () {
            let defineMsg = function (obj) {
                RongIMClient.registerMessageType(obj.msgName, obj.objName, obj.msgTag, obj.msgProperties);
            };
            //注册普通消息
            let message = {
                msgName: 'LAYIM_TEXT_MESSAGE',
                objName: 'LAYIM:CHAT',
                msgTag: new lib.MessageTag(false, false),
                msgProperties: ["username", "avatar", "id", "type", "content"]
            };

            let notice = {
                msgName: 'LAYIM_TEXT_NOTICE',
                objName: 'LAYIM:NOTICE',
                msgTag: new lib.MessageTag(false, false),
                msgProperties: ["system", "id", "type", "content", "category"]
            };
            //注册
            defineMsg(message);
            defineMsg(notice);
        },
        send: function (conversationType, targetId, detail) {
            //发送消息
            RongIMClient.getInstance().sendMessage(conversationType, targetId, detail, {
                onSuccess: function (message) {
                    console.log(message);
                    console.log('发送消息成功');
                },
                onError: function (errorCode, message) {
                    let info = '';
                    switch (errorCode) {
                        case RongIMLib.ErrorCode.TIMEOUT:
                            info = '超时';
                            break;
                        case RongIMLib.ErrorCode.UNKNOWN:
                            info = '未知错误';
                            break;
                        case RongIMLib.ErrorCode.REJECTED_BY_BLACKLIST:
                            info = '在黑名单中，无法向对方发送消息';
                            break;
                        case RongIMLib.ErrorCode.NOT_IN_DISCUSSION:
                            info = '不在讨论组中';
                            break;
                        case RongIMLib.ErrorCode.NOT_IN_GROUP:
                            info = '不在群组中';
                            break;
                        case RongIMLib.ErrorCode.NOT_IN_CHATROOM:
                            info = '不在聊天室中';
                            break;
                    }
                    layer.msg('发送失败: ' + info + errorCode);
                }
            });
        },
        sendMsg: function (data, type = 'message') {
            let mine = data.mine, to = data.to, id = mine.id, group = to.type == 'group';
            if (group) {
                id = to.id;
            }

            // 这里要判断消息类型  私聊,其他会话选择相应的消息类型即可。
            let conversationType = group ? lib.ConversationType.GROUP : lib.ConversationType.PRIVATE;

            let targetId = to.id.toString(), msg, message;
            if (type == 'notice') {
                msg = mine.content;
                message = new RongIMClient.RegisterMessage.LAYIM_TEXT_NOTICE(msg);
            } else {
                msg = {
                    username: mine.username
                    , avatar: mine.avatar
                    , id: id
                    , type: to.type
                    , content: mine.content
                };
                message = new RongIMClient.RegisterMessage.LAYIM_TEXT_MESSAGE(msg);
            }
            //发送消息
            im.send(conversationType, targetId, message);
        },
        joinChatRoom: function (chatRoomId, count = 10) {
            let cid = (chatRoomId || '0').toString();  // 群 Id 。
            RongIMClient.getInstance().joinChatRoom(cid, count, {
                onSuccess: function () {
                    console.log('加入聊天室成功');
                },
                onError: function (error) {
                    console.log('加入聊天室失败');
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
                    url: './json/getMembers.json'
                    , type: 'get'
                    , data: {}
                }
                , uploadImage: {
                    url: './json/image.json'
                    , type: 'get'
                }
                , uploadFile: {
                    url: './json/file.json'
                    , type: 'get'
                }
                , tool: [{
                    alias: 'code'
                    , title: '代码'
                    , icon: '&#xe64e;'
                }]
                , msgbox: './msgbox.html'
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
                layim.msgbox(1);
                im.joinChatRoom(1, 0) // 加入融云聊天室
                let onlineMessage = {
                    mine: {
                        content: {
                            system: true //系统消息
                            , id: 100001 //聊天窗口ID
                            , type: "friend" //聊天窗口类型
                            , content: '对方已上线'
                            , category: 'online'
                        }
                    },
                    to: {
                        avatar: "../img/shanks.jpg",
                        id: "100002",
                        name: "Shanks",
                        sign: "给我个面子如何？",
                        status: "offline",
                        type: "friend",
                        username: "Shanks",
                    }
                };

                im.sendMsg(onlineMessage, 'notice');
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

            //监听聊天窗口的切换
            layim.on('chatChange', function (res) {
                let type = res.data.type;
                layim.setChatStatus('<span style="color:#999;">' + res.data.sign + '</span>');
            });

            layim.on('sendMessage', function (data) {
                im.sendMsg(data);
            });
        },
    };


    exports('im', im);
});