var AWS = require('aws-sdk');
AWS.config.update({region:'ap-southeast-2'});


var kms = new AWS.KMS();

var passpharse = "AQICAHj0IWpj/GaBoAnfpbIDMwVqAJcMgNQx5M7JRi0uMcMJCwEfGbmhLxT6AtTfVtjf4L/hAAAAZzBlBgkqhkiG9w0BBwagWDBWAgEAMFEGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMy3aN8RBx9e0kEcsKAgEQgCTvGeDN3S0VrUkoW6iSHxRDKiPCM86d9K0bsntBY0u8h4fA1XU=";
var b64string = passpharse;
var buf = Buffer.from(b64string, 'base64');
console.log(buf);

var params = {
        CiphertextBlob: buf // The encrypted data (ciphertext).
};

var getRdsPassphrase = function getRdsPassphrase(callback) {
    kms.decrypt(params, function(err, data) {
        if (err != null) {
            callback(err, null);
            return;
        }

        callback(null, (Buffer.from(data.Plaintext, 'base64')).toString())
    });
};


module.exports = {
    getRdsPassphrase: getRdsPassphrase
};