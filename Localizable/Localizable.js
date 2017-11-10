
var en = require('./en.js');
var vi = require('./vi.js');
var ar = require('./ar.js');
module.exports = class Localizable {

    getLocalMessage(language,msg){

        var languageString = "";
        if (language == 'vi') {
            languageString = vi[msg];
        }else if (language == 'ar') {
            languageString = ar[msg];
        }else{
            languageString = en[msg];
        }

        return languageString;
    }

};