const PubSub = require('pubsub-js');
const axios = require('axios').default;
const config = require('config');
const {Message} = require('../models/message');

async function msg_subscriber(msg, data) {
    console.log('======> receiving a message ',msg,'with the following data',data);

    let bwMsg = {
        to : data.to,
        from : data.from,
        text : data.text,
        applicationId : '3a93bf20-e272-40d7-81c8-14acf0f200f7',
        tag : 'test message'
    }

    const msgResponse = await sendPost (bwMsg);

/*
     {
        id: '1614711518243ucu5poy3k6jlq3ah',
        owner: '+19199754739',
        applicationId: '3a93bf20-e272-40d7-81c8-14acf0f200f7',
        time: '2021-03-02T18:58:38.243Z',
        segmentCount: 1,
        direction: 'out',
        to: [ '+18045030091' ],
        from: '+19199754739',
        text: 'this is your message',
        tag: 'test message'
      }  

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
*/

// const messageSchema = new mongoose.Schema({
//     to: { type: String, required: true  },
//     from: { type: String, required: true },
//     text: { type: String, required: true, minlength: 1, maxlength: 140  },
//     externalId: {type:String},
//     direction: { type: String, enum: ['in', 'out'] },
//     status: {
//         type: String, 
//         enum["message-attempted","message-delivered","message-failed","message-received"]
//     },
//     time: {type: Date},
//     updateTime: {type: Date}
//   });

    console.log(msgResponse);
    try {
        const dbMsg = await Message.findByIdAndUpdate(data._id,
            { 
                externalId: msgResponse.id,
                direction: msgResponse.direction,
                status: 'message-attempted',
                time: msgResponse.time
            }
            , { new: true }
        );
        console.log('updated message',dbMsg);
    } catch (ex) {
        console.error(ex);
    }
}

async function alert_subscriber(msg, data) {
    console.log('======> receiving an alert ',msg,'with the following data',data);

// if we have an alert - write it to the database
// - it might be an incoming message
// - it might be a delivery notification of some sort
// the user will poll the system to find out what's happening, 
// at least for now.

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

// const messageSchema = new mongoose.Schema({
//     to: { type: String, required: true  },
//     from: { type: String, required: true },
//     text: { type: String, required: true, minlength: 1, maxlength: 140  },
//     externalId: {type:String},
//     direction: { type: String, enum: ['in', 'out'] },
//     status: {
//         type: String, 
//         enum: ["message-attempted","message-delivered","message-failed","message-received"]
//     },
//     time: {type: Date},
//     updateTime: {type: Date}
//   });

    if (data.type == 'message-received') {
        // this is a new message that needs to be persisted
        // other than saving it, no other action will be taken
        // the user needs to come and get it.
        // TODO - find a notification scheme !!!  It likely requires registration against the 'to'
        const [realTo] = data.message.to;
        let message = new Message(
            { to: realTo,
            from: data.message.from,
            text: data.message.text,
            externalId: data.message.id,
            direction: data.message.direction,
            status: data.type,
            time: data.message.time,
            updateTime: data.time
        });

        message = await message.save();
    } else { // this is an update to an existing
        try { // we have to find the original message !!!!
            const dbMsg = await Message.findOneAndUpdate({externalId:data.message.id},
                { 
                    // to: data.message.to,
                    // from: data.message.from,
                    // text: data.message.text,
                    // externalId: data.message.id,
                    // direction: data.message.direction,
                    status: data.type,
                    // time: data.message.time,
                    updateTime: data.time
                }
                , { new: true }
            );
            console.log('updated message',dbMsg);
        } catch (ex) {
            console.error(err);
        }
    }
}


async function sendPost (messageToSend){
    console.log(`...........sending a POST ${messageToSend}`);

    try {
        const creds = config.get('irisMsg');
        console.log('creds are...',creds);
        const url = (creds.account ? 
            `${creds.baseUrl}/${creds.account}/messages` :
            `${creds.baseUrl}`);
        console.log('URL is ',url);
        const response = await axios.post(
            url,
            messageToSend,
            (creds.account ? 
                {
                auth: {
                  username: creds.user,
                  password: creds.password
                    }
                }  : null )
            );
        console.log(`Good Response ${response.status}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(`ERROR ${error}`);
    }

};

function launch() {
    PubSub.subscribe('Message',msg_subscriber);
    PubSub.subscribe('Alert',alert_subscriber);
}

module.exports.launch = launch;