var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config.js');
var bodyParser = require('body-parser');
var escapeSQL = require('sqlstring');
var jwt = require('jsonwebtoken');

// parse application/x-www-form-urlencoded
var urlParser = bodyParser.urlencoded({ extended: false });
// parse application/json
router.use(bodyParser.json());
var async = require('async');

/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
var Base = require('../base.js');
var BASE = new Base();
var client = BASE.client();
var LocalString = require('../localizable/localizable.js');
var LOCALIZABLE = new LocalString();
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------*/
//-- FCM
var FCM = require('fcm-push');
var serverKey = config.android;
var collapse_key = 'com.android.abc';
var fcm = new FCM(serverKey);
// 
var apn = require('apn');
var apnService = new apn.Provider({
    cert: "certificates/cert.pem",
    key: "certificates/key.pem",
});
/*********--------------------------*********
 **********------- FUNCTION ------*********
 **********--------------------------*********/

/*********--------Following----------*********/
router.get('/global_setting', urlParser, function(req, res) {
    var userSQL = "SELECT * FROM `global_settings`";
    client.query(userSQL, function(e, d, fBlock) {
        if (e) {
            return res.sendStatus(300);
        } else {
            if (d.length > 0) {
                return res.send(echoResponse(200, data[0], 'globak setting', false));
            } else {
                return res.send(echoResponse(404, "no data.", 'success', true));
            }
        }
    });

});

function isBlockedCheck(key, friend_key, isBlocked) {
    var userSQL = "SELECT * FROM `global_settings`";
    client.query(userSQL, function(e, d, fBlock) {
        if (e) {
            isBlocked(false);
        } else {
            if (d.length > 0) {
                isBlocked(true);
            } else {
                isBlocked(false);
            }
        }
    });
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


module.exports = router;