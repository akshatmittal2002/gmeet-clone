const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Meeting = require('../models/meetings');
const passport = require('passport');
const { v4: uuidV4 } = require('uuid');
const middlewares = require('../middleware');
const UserMeetPacket = require('../models/usermeetingpacket');
const sendEmail = require('../sendemail');
const notifyJoined = require('../app');
const io = require('socket.io');
router.get('/', middlewares.loginRequired, async (req, res) => {
    const MeetingDetails = await UserMeetPacket.find({ userId: req.user._id });
    res.render('Meetings.ejs', { MeetingDetails: MeetingDetails });
})
router.get('/startmeeting/:room', middlewares.loginRequired, async (req, res) => {


    const roomId = req.params.room;
    const isValidMeeting = await UserMeetPacket.find(({ userId: req.user._id, roomId: roomId }));
    const meetingDetails = await Meeting.find({ RoomId: roomId });
    console.log(meetingDetails);
    if (isValidMeeting && isValidMeeting.length > 0) {

        res.render('room', { roomId: req.params.room, userId: req.user._id,username:req.user.username });
    }
    else {
        if (meetingDetails&&meetingDetails.length>0) {
            console.log(meetingDetails);
            req.session.author = meetingDetails[0].author;
            console.log(req.session);
            req.session.roomId = roomId;
            res.redirect('/pendingroom');
        }
        else {

            req.flash('failure', 'You are not allowed to join this room');
            res.redirect('/meeting/schedule');
        }
    }



})
router.get('/details/:room', middlewares.loginRequired, async (req, res) => {
    const meetingDetails = await Meeting.findOne({ roomId: req.params.room });
    console.log(meetingDetails);
    res.render('meetingdetails.ejs', { meetingDetails: meetingDetails });
})
router.get('/schedule', middlewares.loginRequired, async (req, res) => {

    const MeetingDetails = await UserMeetPacket.find({ userId: req.user._id });
    res.render('schedulemeeting.ejs', { MeetingDetails: MeetingDetails });
})
router.post('/schedule', middlewares.loginRequired, async (req, res) => {
    const newMeeting = new Meeting({});
    console.log('This is req.body()');
    let date_obj = new Date();
    console.log(date_obj);
    console.log(req.body);
    if ((req.body.startTime === "") || (req.body.endTime === "") || (req.body.meetingName === "")) {
        req.flash('failure', 'Any of the entered fields cannot be empty');
        res.redirect('/meeting/schedule');
    }
    else {
        newMeeting.startTime = req.body.startTime;
        newMeeting.endTime = req.body.endTime;
        newMeeting.author = req.user._id;
        newMeeting.authorName = req.user.username;
        newMeeting.Name = req.body.meetingName;
        newMeeting.Users.push(req.user._id);
        newMeeting.RoomId = uuidV4();
        // console.log(newMeeting);
        const donevalue = await newMeeting.save();
        const diffTime = Math.abs(donevalue.startTime - date_obj);
        console.log(donevalue.startTime);
        const sendDate = donevalue.startTime;
        console.log(req.user.email);
        sendEmail(req.user.email, sendDate, req.user.username, newMeeting.RoomId);
        const newPacket = new UserMeetPacket({});
        newPacket.userId = req.user._id;
        newPacket.authorId = req.user._id;
        newPacket.meetingId = newMeeting._id;
        newPacket.roomId = newMeeting.RoomId;
        newPacket.meetingName = newMeeting.Name;
        const packetDone = await newPacket.save();
        // console.log(packetDone);
        res.redirect('/meeting');
    }


})
module.exports = router;