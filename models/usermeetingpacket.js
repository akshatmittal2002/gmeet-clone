const mongoose = require('mongoose');

const UserMeetPacketSchema = new mongoose.Schema(
    {
        userId:  {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        meetingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meeting',
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        roomId: String,
        meetingName: String,
    }
)
module.exports = mongoose.model('UserMeetPacket',UserMeetPacketSchema);