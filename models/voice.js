const {Schema, model} = require('mongoose');

const VoiceShema = Schema({
    vcId: {
        type: String,
        required: true
    }
});

module.exports = model('Voice', VoiceShema);