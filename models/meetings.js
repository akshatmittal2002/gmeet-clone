var mongoose = require('mongoose');
var MeetingSchema = new mongoose.Schema({
    Name: String,
    startTime: Date,
    endTime: Date,
    RoomId: String,
    authorName: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});
module.exports = mongoose.model('Meeting', MeetingSchema);
