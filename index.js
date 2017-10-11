process.env.NODE_ENV = 'production';
//process.setMaxListeners(0);
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var md5 = require('md5');
var escapeSQL = require('sqlstring');
var config = require('./config.js');
app.io = io;
//access-token
var jwt = require('jsonwebtoken');
//---
var events = require('events');
var eventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(0);

var firebase = require('firebase');

var bodyParser = require('body-parser');
var mysql = require('mysql');
var moment = require('moment-timezone');
var connections = [];
var apn = require('apn');
var apnService = new apn.Provider({
    cert: "certificates/cert.pem",
    key: "certificates/key.pem",
});
//-- FCM
var FCM = require('fcm-push');
var serverKey = config.android;
var collapse_key = 'com.android.abc';
var fcm = new FCM(serverKey);
var avatarApp = "http://i.imgur.com/rt1NU2t.png";

var async = require('async');
var _ = require('lodash');
var moment = require('moment-timezone');

var urlParser = bodyParser.urlencoded({ extended: false });

var configFirebase = {
    apiKey: "AIzaSyAmYRokQALuWuM53U3O2n2d58N3vdml8uc",
    authDomain: "thinkdiff-71ab0.appspot.com",
    databaseURL: "https://thinkdiff-71ab0.firebaseio.com",
    storageBucket: "thinkdiff-71ab0.appspot.com",
    messagingSenderId: "837773260215"
};

firebase.initializeApp(configFirebase);

server.listen(config.app_port, config.app_ip, function() {
    console.log("Server running @ http://" + config.app_ip + ":" + config.app_port);
});
server.timeout = 60000;

// --- CREATED VARIABLE ---
// ------------------------
// ------------------------
var users = [];
var index = 0;
var incomings = [];
/*********--------------------------*********
 **********------- MYSQL CONNECT ----*********
 **********--------------------------*********/
var client;

function startConnection() {
    console.error('CONNECTING');
    client = mysql.createConnection({
        host: config.mysql_host,
        user: config.mysql_user,
        password: config.mysql_pass,
        database: config.mysql_data
    });
    client.connect(function(err) {
        if (err) {
            console.error('CONNECT FAILED MESSAGE', err.code);
            startConnection();
        } else {
            console.error('CONNECTED MESSAGE');
        }
    });
    client.on('error', function(err) {
        if (err.fatal)
            startConnection();
    });
}
startConnection();
client.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci", function(error, results, fields) {
    if (error) {
        console.log(error);
    } else {
        console.log("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    }
});
client.query("SET CHARACTER SET utf8mb4", function(error, results, fields) {
    if (error) {
        console.log(error);
    } else {
        console.log("SET CHARACTER SET utf8mb4");
    }
});
/*********--------------------------*********
 **********------- FUNCTION ------*********
 **********--------------------------*********/
io.on('connection', function(socket) { // Incoming connections from clients
    var peer;
    socket.on('online', function(user) {
        if (findUserByUID(user.uuid) == null) {
            var usr = { id: user.uuid, key: user.key, socketid: socket.id };
            users.push(usr);
            socket.emit('register succeed', { id: user.uuid, key: user.key });
            socket.broadcast.emit('new user', { id: user.uuid, key: user.key });
            peer = usr;
        }
        // 
        var keyUser = "";
        if (user.key !== null && typeof user === 'object') {
            keyUser = user.key;
            socket.emit('reload', keyUser);
            var sqlCheckVisible = "SELECT `is_visible` FROM `users_settings` WHERE `users_key`='" + keyUser + "'";
            client.query(sqlCheckVisible, function(eCheck, dCheck, fCheck) {
                if (eCheck) {
                    console.log(eCheck);
                } else {
                    if (dCheck.length > 0) {
                        if (dCheck[0].is_visible == 1) {
                            var currentTimeFill = new Date().getTime();
                            var queryFill = "UPDATE `users` SET `status`='offline',`last_active`='" + currentTimeFill + "' WHERE `status`!='offline' AND `socket_id`='null' OR `socket_id` IS NULL";
                            client.query(queryFill, function(error, results, fields) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log("Fill last_active is updated");
                                }
                            });
                            var query = "UPDATE `users` SET `status`='online', `socket_id`='" + socket.id + "' WHERE `key`='" + keyUser + "'";
                            client.query(query, function(error, results, fields) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(keyUser + " vừa online");
                                }
                            });
                        } else {
                            var currentTime = new Date().getTime();
                            var query = "UPDATE `users` SET `status`='offline',`socket_id`='null',`last_active`='" + currentTime + "' WHERE `key`='" + keyUser + "'";
                            client.query(query, function(error, results, fields) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log("last_active is updated");
                                }
                            });
                        }
                    }
                }
            });
        }
    });
    socket.on('status', function(check) {
        if (check === 'online') {
            console.log("Co ket noi");
            var json = { id: ["100002398569411", "100006954612394"] };
            //socket.emit('facebook',{"id":"100002398569411"});
            socket.emit('facebook', json);
        }
    });

    // Roi vao disconnect
    socket.on('disconnect', function(data) {
        var index = users.indexOf(peer);
        if (index != -1) {
            var usr = users[index];
            users.splice(index, 1);
            socket.broadcast.emit('user leave', { id: usr.id, key: usr.key });
        }
        // END CALL VIDEO
        var checkquery = "SELECT * FROM `users` WHERE `socket_id`='" + socket.id + "'";
        client.query(checkquery, function(errorrr, resultsss, fieldsss) {
            if (errorrr) {
                console.log(errorrr);
            } else {
                if (resultsss.length > 0) {
                    //-- CHANGE STATUS TYPING
                    /*var ref = firebase.database().ref("ChatApp/Chat/Typing");
                    ref.orderByChild(resultsss[0]['key']+'/sender_id').equalTo(resultsss[0]['key']).on("child_added", function(snapshot) {
                          snapshot.ref.child(resultsss[0]['key']).update({status:"0"});
                    });
                    console.log('typing status is updated: '+resultsss[0]['key']);*/
                    //-- END CHANGE
                    var currentTime = new Date().getTime();
                    var query = "UPDATE `users` SET `status`='offline',`last_active`='" + currentTime + "' WHERE `socket_id`='" + socket.id + "'";
                    client.query(query, function(error, results, fields) {
                        if (error) {
                            console.log(error);
                        } else {
                            var sq = "UPDATE `users` SET `socket_id`='null' WHERE `status`='offline'";
                            client.query(sq, function(err, ress, fie) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    socket.emit('reload', resultsss[0].key);
                                    console.log("last_active is updated");
                                }
                            });
                        }
                    });
                }
            }
        });
        connections.splice(connections.indexOf(socket), 1);
        console.log("Disconnected: %s sockets connected", connections.length);
    });
    socket.on('chat message', function(msg) {
        console.log(JSON.stringify(msg));
        if (msg.subtype == 'candidate') {
            if (incomings.length > 0) {
                async.forEachOf(incomings, function(el, i, callback) {
                    if (el.key != msg.to) {
                        sendNotification(msg.from, msg.to, "is calling", "calling", msg);
                        var current = 0;
                        var timer = setInterval(function() {
                            current++;
                            sendNotification(msg.from, msg.to, "is calling", "calling", msg);
                            if (current == 3) {
                                clearInterval(timer);
                            }
                        }, 5500);
                        incomings.push({ key: msg.to, timer: timer });
                        incomings = _.uniqBy(incomings, 'key');
                    }
                });
            } else {
                sendNotification(msg.from, msg.to, "is calling", "calling", msg);
                var current = 0;
                var timer = setInterval(function() {
                    current++;
                    sendNotification(msg.from, msg.to, "is calling", "calling", msg);
                    if (current == 3) {
                        clearInterval(timer);
                    }
                }, 5500);
                incomings.push({ key: msg.to, timer: timer });
                incomings = _.uniqBy(incomings, 'key');
            }
        }
        if (msg.subtype == 'close') {
            async.forEachOf(incomings, function(el, i, callback) {
                if (el.key == msg.to) {
                    send(msg.from, msg.to, "You missed a call from", "close", msg);
                    clearInterval(el.timer);
                    _.remove(incomings, {
                        key: msg.to
                    });
                }
            });
        }

        if (msg.to == 'all') {
            socket.broadcast.emit('chat message', msg);
        } else {
            var target = findUserByUID(msg.to);
            if (target) {
                // Send notifications
                socket.broadcast.to(target.socketid).emit('chat message', msg);
                //socket_to.emit("chat message", msg);
            } else {
                socket.broadcast.emit("chat message", msg);
            }
        }
    });
    //end socket
});



app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(__dirname + '/public'));

app.get('/listUsers', function(req, res) {
    res.end(JSON.stringify(users, censor));
});
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/:username', urlParser, function(req, res) {
    res.sendFile(__dirname + '/info.php');
});


function sendNotification(sender_key, receiver_key, noidung, kieu, message) {
    var senderSQL = "SELECT `nickname` FROM `users` WHERE `key`='" + sender_key + "'";
    client.query(senderSQL, function(loiNguoiGui, dataNguoiGui, FNG) {
        if (loiNguoiGui) {
            console.log(loiNguoiGui);
        } else {
            numberBadge(receiver_key, function(count) {
                var receiverSQL = "SELECT `device_token`,`device_type` FROM `users` WHERE `key`='" + receiver_key + "'";
                client.query(receiverSQL, function(loiNguoiNhan, dataNguoiNhan, FNN) {
                    if (loiNguoiNhan) {
                        console.log(loiNguoiNhan);
                    } else {
                        if (dataNguoiNhan[0].device_type == 'ios') {
                            //--------APNS
                            var note = new apn.Notification();
                            note.alert = dataNguoiGui[0].nickname + " " + noidung;
                            note.sound = 'dong.aiff';
                            note.topic = config.ios;
                            note.badge = count;
                            if (message) {
                                note.payload = {
                                    "message": message,
                                    "content": dataNguoiGui[0].nickname + " " + noidung,
                                    "type": kieu
                                };
                            } else {
                                note.payload = {
                                    "sender_id": sender_key,
                                    "content": dataNguoiGui[0].nickname + " " + noidung,
                                    "type": kieu
                                };
                            }

                            apnService.send(note, dataNguoiNhan[0].device_token).then(result => {
                                console.log("sent:", result.sent.length);
                            });
                        } else {
                            var message;
                            if (message) {
                                message = {
                                    to: dataNguoiNhan[0].device_token,
                                    collapse_key: collapse_key,
                                    data: {
                                        message: message,
                                        content: dataNguoiGui[0].nickname + " " + noidung,
                                        type: kieu,
                                        title: 'IUDI',
                                        body: dataNguoiGui[0].nickname + " " + noidung
                                    }
                                };
                            } else {
                                message = {
                                    to: dataNguoiNhan[0].device_token,
                                    collapse_key: collapse_key,
                                    data: {
                                        sender_id: sender_key,
                                        content: dataNguoiGui[0].nickname + " " + noidung,
                                        type: kieu,
                                        title: 'IUDI',
                                        body: dataNguoiGui[0].nickname + " " + noidung
                                    }
                                };
                            }

                            //callback style
                            fcm.send(message, function(err, response) {
                                if (err) {
                                    console.log("Something has gone wrong!");
                                } else {
                                    console.log("Successfully sent with response: ", response);
                                }
                            });
                        }
                    }
                });
            });
        }
    });
}
function send(sender_key, receiver_key, noidung, kieu, message) {
    var senderSQL = "SELECT `nickname` FROM `users` WHERE `key`='" + sender_key + "'";
    client.query(senderSQL, function(loiNguoiGui, dataNguoiGui, FNG) {
        if (loiNguoiGui) {
            console.log(loiNguoiGui);
        } else {
            numberBadge(receiver_key, function(count) {
                var receiverSQL = "SELECT `device_token`,`device_type` FROM `users` WHERE `key`='" + receiver_key + "'";
                client.query(receiverSQL, function(loiNguoiNhan, dataNguoiNhan, FNN) {
                    if (loiNguoiNhan) {
                        console.log(loiNguoiNhan);
                    } else {
                        if (dataNguoiNhan[0].device_type == 'ios') {
                            //--------APNS
                            var note = new apn.Notification();
                            note.alert =  noidung + " " + dataNguoiGui[0].nickname;
                            note.sound = 'dong.aiff';
                            note.topic = config.ios;
                            note.badge = count;
                            if (message) {
                                note.payload = {
                                    "message": message,
                                    "content": noidung + " " + dataNguoiGui[0].nickname,
                                    "type": kieu
                                };
                            } else {
                                note.payload = {
                                    "sender_id": sender_key,
                                    "content": noidung + " " + dataNguoiGui[0].nickname,
                                    "type": kieu
                                };
                            }

                            apnService.send(note, dataNguoiNhan[0].device_token).then(result => {
                                console.log("sent:", result.sent.length);
                            });
                        } else {
                            var message;
                            if (message) {
                                message = {
                                    to: dataNguoiNhan[0].device_token,
                                    collapse_key: collapse_key,
                                    data: {
                                        message: message,
                                        content: noidung + " " + dataNguoiGui[0].nickname,
                                        type: kieu,
                                        title: 'IUDI',
                                        body: noidung + " " + dataNguoiGui[0].nickname
                                    }
                                };
                            } else {
                                message = {
                                    to: dataNguoiNhan[0].device_token,
                                    collapse_key: collapse_key,
                                    data: {
                                        sender_id: sender_key,
                                        content: noidung + " " + dataNguoiGui[0].nickname,
                                        type: kieu,
                                        title: 'IUDI',
                                        body: noidung + " " + dataNguoiGui[0].nickname
                                    }
                                };
                            }

                            //callback style
                            fcm.send(message, function(err, response) {
                                if (err) {
                                    console.log("Something has gone wrong!");
                                } else {
                                    console.log("Successfully sent with response: ", response);
                                }
                            });
                        }
                    }
                });
            });
        }
    });
}
/*********--------------------------*********
 **********------ ECHO RESPONSE -----*********
 **********--------------------------*********/
function echoResponse(status, data, message, error) {
    return JSON.stringify({
        status: status,
        data: data,
        message: message,
        error: error
    });
}

function numberBadge(key, count) {
    var userSQL = "SELECT `key` FROM conversations INNER JOIN members ON members.conversations_key = conversations.key AND members.users_key = '" + key + "' AND members.is_deleted='0'";
    client.query(userSQL, function(qError, qData, qFiels) {
        if (qError) {
            console.log(qError);
            count(0);
        } else {
            if (qData.length > 0) {
                var conversationUnread = [];
                async.forEachOf(qData, function(data, i, call) {
                    var sqlSelect = "SELECT `key` FROM conversations INNER JOIN members ON members.conversations_key = conversations.key AND members.users_key = '" + key + "' AND members.is_deleted='0' AND `key` IN (SELECT `conversations_key` FROM `message_status` WHERE `conversations_key`='" + qData[i].key + "' AND `users_key`='" + key + "' AND `is_read`='0')";
                    client.query(sqlSelect, function(e, d, f) {
                        if (e) {
                            console.log(e);
                            return res.sendStatus(300);
                        } else {
                            if (d.length > 0) {
                                conversationUnread.push(qData[i]);
                            }
                            if (i === qData.length - 1) {
                                var userSQL = "SELECT * FROM `notification_feed` INNER JOIN `notification_refresh` ON `notification_feed`.`users_key` = '" + key + "' AND `notification_feed`.`users_key` = notification_refresh.users_key AND `notification_feed`.`time` > `notification_refresh`.`time`";
                                client.query(userSQL, function(error, data, fields) {
                                    if (error) {
                                        console.log(error);
                                        return res.sendStatus(300);
                                    } else {
                                        if (data.length > 0) {
                                            count(conversationUnread.length + data.length);
                                        } else {
                                            count(conversationUnread.length);
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            } else {
                count(0);
            }
        }
    });
}

function findIndexByUID(uid) {
    var i;
    for (i = 0; i < users.length; i++) {
        if (users[i].id == uid) break;
    }
    if (i == users.length) return -1;
    return i;
}

function findUserByUID(uid) {
    var index = findIndexByUID(uid);
    if (index == -1) {
        return null;
    }
    return users[index];
}

function censor(key, value) {
    if (key == 'socketid') {
        return undefined;
    }
    return value;
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/*********--------------------------*********
 **********------- CONTROLLERS ------*********
 **********--------------------------*********/
app.use(require('./controllers'));