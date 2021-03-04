
const messagingClient = require('../clients/messaging');

module.exports = function() {
    console.log('in startup clients.js - launching messaging');
    messagingClient.launch('');
}