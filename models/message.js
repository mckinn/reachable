const { text } = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');

// Cheating and letting Mongoose manage the message schema

  // {
  //   "time": "2021-03-03T14:52:45.066Z",
  //   "type": "message-received",
  //   "to": "+19199754739",
  //   "description": "Incoming message received",
  //   "message": {
  //     "id": "df5753b4-3c62-4d34-b8cd-8ab8d4a3745e",
  //     "owner": "+19199754739",
  //     "applicationId": "3a93bf20-e272-40d7-81c8-14acf0f200f7",
  //     "time": "2021-03-03T14:52:44.901Z",
  //     "segmentCount": 1,
  //     "direction": "in",
  //     "to": [
  //       "+19199754739"
  //     ],
  //     "from": "+18045030091",
  //     "text": "A reply"
  //   }
  // }

const messageSchema = new mongoose.Schema({
    to: { type: String, required: true  },
    from: { type: String, required: true },
    text: { type: String, required: true, minlength: 1, maxlength: 140  },
    externalId: {type:String},
    direction: { type: String, enum: ['in', 'out'] },
    status: {
        type: String, 
        enum: ["message-attempted","message-delivered","message-failed","message-received"]
    },
    time: {type: Date},
    updateTime: {type: Date}
  });

const Message = mongoose.model('Message', messageSchema);

// TODO - it is unclear whether the validation needs to be in the route or in the model.
// TODO - make this decision later once we know more.

function validateMessage(message) {
  const schema = Joi.object({
    to: Joi.string().pattern(/^\+1\d{10}$/).required(),
    from: Joi.string().pattern(/^\+1\d{10}$/).required(),
    text: Joi.string().min(1).max(140).required()
  });
  return schema.validate(message);
}

function validateAlert(message) {
  // TODO - extend this to all fields that we need to validate - this is a placeholder
  const schema = Joi.object({
    //TODO - extend this error checking 
    time: Joi.date(),
    type: Joi.valid('message-delivered','message-failed','message-received').required(), 
    to: Joi.string().pattern(/^\+1\d{10}$/).required(),
    description: Joi.string(),
    message: Joi.object()
  });
  return schema.validate(message);
}

exports.messageSchema = messageSchema;
exports.Message = Message; 
exports.validateMessage = validateMessage;
exports.validateAlert = validateAlert;