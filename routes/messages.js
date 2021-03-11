const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {Message, validateMessage} = require('../models/message');
const Joi = require('joi');
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

// Signature 
// - /messages/<id>
// - /messages?[to=<TN>|from=<TN>]&since=<Date>
//    the client needs to keep track of the last time/date  that was checked
//    for any new messages
//    the future holds a notificatoin that will update when the 
//    alerts happen

router.get('/:id', validateObjectId, async (req, res) => {
    const message = await Message.findById(req.params.id);
  
    if (!message) return res.status(404).send('The genre with the given ID was not found.');
  
    res.send(message);
});

function validateMessagingQueryParms (parms){
    // /messages?since=<data>&to=<TN>&from=<TN>
    // since will default to the current day
    // to and from filter the collection
    // parms that we don't recognize we ignore

    let thisMorning = new Date();
    thisMorning.setMilliseconds(0);
    thisMorning.setSeconds(0);
    thisMorning.setMinutes(0);
    thisMorning.setHours(0);

    const schema = Joi.object({
        since: Joi.date().default(thisMorning),
        to: Joi.string().pattern(/^1\d{10}$/),
        from: Joi.string().pattern(/^1\d{10}$/)
    });
    
    return schema.validate(parms);
}

router.get('/', async (req, res) => {
    const query  = req.query;
    console.log('queryparms are... ',query);
    console.log('Joi schema is...',validateMessagingQueryParms(query));
    const {error,value} = validateMessagingQueryParms(query);
    if (error) return res.status(400).send(error.details[0].message);

    mongoQuery = { time: { $gte: value.since } };
    if (value.to) mongoQuery.to = `+${value.to}`;
    if (value.from) mongoQuery.to = `+${value.from}`;

    console.log('Search schema is...',mongoQuery);
    const messages = await Message.find(mongoQuery);
    res.status(200).send(messages);
});

module.exports = router;