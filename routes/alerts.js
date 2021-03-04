// const auth = require('../middleware/auth');
// const {Message, validate} = require('../models/message');
// const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const PubSub = require('pubsub-js');
const Joi = require('joi');
const {validateAlert} = require('../models/message');  //TODO - this validation is in the wrong place

// [
//   {
//     "time": "2021-03-03T14:40:52.752Z",
//     "type": ["message-delivered","message-failed","message-received"]
//     "to": "+18045030091",
//     "description": "ok",
//     "message": {
//       "id": "1614782452309x5yn6tkdhcr355ss",
//       "owner": "+19199754739",
//       "applicationId": "3a93bf20-e272-40d7-81c8-14acf0f200f7",
//       "time": "2021-03-03T14:40:52.309Z",
//       "segmentCount": 1,
//       "direction": "out",
//       "to": [
//         "+18045030091"
//       ],
//       "from": "+19199754739",
//       "text": "",
//       "tag": "test message"
//     }
//   }
// ]
// [
//   {
//     "time": "2021-03-03T14:52:45.066Z",
//     "type": "message-received",
//     "to": "+19199754739",
//     "description": "Incoming message received",
//     "message": {
//       "id": "df5753b4-3c62-4d34-b8cd-8ab8d4a3745e",
//       "owner": "+19199754739",
//       "applicationId": "3a93bf20-e272-40d7-81c8-14acf0f200f7",
//       "time": "2021-03-03T14:52:44.901Z",
//       "segmentCount": 1,
//       "direction": "in",
//       "to": [
//         "+19199754739"
//       ],
//       "from": "+18045030091",
//       "text": "A reply"
//     }
//   }
// ]

// currently imported from message.js - that does not feel right, but is consistent with the pattern
// function validateAlert(alert) {

//   const schema = Joi.object({
//     //TODO - extend this error checking 
//     time: Joi.date(),
//     type: Joi.valid('message-delivered','message-failed','message-received').required(), 
//     to: Joi.string().min(12).max(12).required(),
//     description: Joi.string(),
//     message: Joi.object()
//   });

//   return schema.validate(message);
// }

router.post('/', async (req, res) => {
  const alertCollection = (Array.isArray(req.body)) ? req.body : [req.body];
  // console.log('Is the body an array?',Array.isArray(alertCollection));
  // console.log('Receiving an Alert:', alertCollection);
  for (let singleAlert of alertCollection) {
    // console.log('The single alert: ', singleAlert);
    const { error } = validateAlert(singleAlert); 
    if (error) {
      console.log('error validating alert',error);
      return res.status(400).send(error.details[0].message);
    }
  }
  for (let singleAlert of alertCollection){
    PubSub.publish('Alert',singleAlert);  // pass the entire body along to the app
  }
  res.status(200).send();   // 200 OK and no response body.
});

module.exports = router;