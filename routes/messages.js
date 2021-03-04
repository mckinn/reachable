const auth = require('../middleware/auth');
const {Message, validateMessage} = require('../models/message');
// const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const PubSub = require('pubsub-js');

// "to"            : ["+12345678902"],
// "from"          : "+12345678901",
// "text"          : "Hey, check this out!",
// "applicationId" : "93de2206-9669-4e07-948d-329f4b722ee2",
// "tag"           : "test message"


router.post('/', auth, async (req, res) => {
  const { error } = validateMessage(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  let message = new Message(
      { to: req.body.to,
        from: req.body.from,
        text: req.body.text
    });
  
  res.send(message);
  PubSub.publish('Message',message);
  message = await message.save();

});

module.exports = router;