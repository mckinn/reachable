const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

// get rid of specific deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

module.exports = function() {
  const db = config.get('db');
  mongoose.connect(db)
    .then(() => winston.info(`Connected to ${db}...`));
}