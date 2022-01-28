const {Schema, model} = require('mongoose');

const RoleShema = Schema({
    roleId: {
        type: String,
        required: true
    }
});

module.exports = model('Role', RoleShema);