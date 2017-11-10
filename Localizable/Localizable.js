
var english = require('./en.js');
var vietname = require('./vi.js');
var arab = require('./ar.js');
module.exports = class Localizable {

    getLocalMessage(language,msg){

        var languageString = "";
        if (language == 'vi') {
            languageString = vietname[msg];
        }else if (language == 'ar') {
            languageString = arab[msg];
        }else{
            languageString = english[msg];
        }

        return languageString;
    }

};