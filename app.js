var express = require('express');
const { Socket } = require('socket.io');
var app = express();
var server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const url = "mongodb://localhost:27017/chat_app";
const userRoute = require('./routes/user');
const meetingRoute = require('./routes/meeting');
const flash = require('connect-flash');
const middlewares = require('./middleware');
const usermeetingpacket = require('./models/usermeetingpacket');
const dotenv = require('dotenv');

dotenv.config();

app.use(session({
    secret: 'whatever you want',
    resave: false,
    saveUninitialized: false
}));

mongoose.connect(process.env.DBURI || url).then((ans) => {
    console.log("ConnectedSuccessfully")
}).catch((err) => {
    console.log("Error in the Connection")
})

app.set('view engine', 'ejs');

//in the below line, if you use a route as /something/id, then that will look at something folder in public.
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//models
var User = require('./models/user');
var Meeting = require('./models/meetings');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var CurrentUserID = null;
//When you even redirect from any route, it will come below first, I mean the request will re propagate.
app.use((req,res,next)=>{
    if(req.session.author==undefined){
        req.session.author = null;
    }
    if(req.session.roomId==undefined){
        req.session.roomId = null;
    }
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.failure = req.flash('failure') || req.flash('error');
    if(req.user){
        CurrentUserID = req.user._id;
    }
    else{
        CurrentUserID = null;
    }
    next();
})
app.use("/user",userRoute);   
app.use("/meeting",meetingRoute);   
app.get('/', (req, res) => {
    res.render('home.ejs');
})
module.exports=function(userId1,userId2){
    io.to(userId1).emit('alert',userId2);
    
}
//To answer, why this roomId and userId is still valid, assume that you are running a function witch socket, and there are many places where you are running the function. Now, the function is a infinite function, and whenever you delete, then it will emit that in that particular event. thats it 
const ListofAllUsers = [];
let status = 0;
io.on('connection', socket => {

    app.get('/pendingroom',middlewares.loginRequired, async function(req,res){
        console.log(req.session);
        console.log(req.session.author);
        const userMeet = await usermeetingpacket.findOne({userId: req.user._id,authorId: req.session.author,roomId: req.session.roomId});
        io.sockets.in(req.session.author).emit('alert',req.user._id);
        if(userMeet){

            res.send(`You are not allowed to come into this page ${userMeet}`);
        }
        else{
            console.log('Hello , Inside')
            socket.on('alert',async (value)=>{
                if(value){

                    console.log('I got an alert !!!!!!');
                    const newuserMeet = new usermeetingpacket();
                    newuserMeet.userId = req.user._id;
                    newuserMeet.authorId = req.session.author;
                    newuserMeet.roomId = req.session.roomId;
                    await newuserMeet.save();
                    res.redirect('/meeting/startmeeting/'+req.session.roomId);
                }
                else{
                    res.send('You are not allowed by user');
                }
            })

        }
        
    })

    console.log('connected!!!');
    socket.on('join-room', (roomId, userId) => {
        ListofAllUsers.push(userId);
        console.log('LIST OF ALL USERS');
        console.log(ListofAllUsers);
        console.log(roomId, userId);
        socket.join(roomId);
        socket.join(userId);
        // io.emit('alert');
        // console.log(roomId, userId );
        socket.to(roomId).emit('newuserjoined',userId);
        socket.on('on-the-video', ()=>{
            console.log('I have just turned on my video, my name is I have emitted message', userId);
            socket.to(roomId).emit('on-the-video',userId);
        })
        socket.on('screen-share-off',(userId)=>{
            console.log('I have received message of screen-share-off');
            socket.to(roomId).emit('screen-share-off',userId);
        })
        socket.on('disconnect', () => {
            console.log('User disconnected');
            const index = ListofAllUsers.indexOf(userId);
            if(index>-1){
                ListofAllUsers.splice(index,1);            
            }
            console.log(userId);
            socket.to(roomId).emit('user-disconnected', userId);
            
        });
        socket.on('video-off',()=>{
            console.log('User Video is OFF');
            console.log(userId);
            socket.to(roomId).emit('off-the-video', userId);
        })
        socket.on('mouseup',(event)=>{
            socket.to(roomId).emit('mouseup',event);
            console.log('mouseup');
            console.log(event);
        })
        socket.on('colorchange',(color)=>{
            socket.to(roomId).emit('colorchange',color);
        })
        socket.on('mousedown',(event)=>{
            console.log('mousedown');
            console.log(event);
            socket.to(roomId).emit('mousedown',event);
        })
        socket.on('mousemove',(event)=>{
            console.log('mousemove');
            console.log(event);
            socket.to(roomId).emit('mousemove',event);
        })
        socket.on('new-chat', (message, roomId) => {
            console.log(message);
            socket.to(roomId).emit('newmessage', message);
        })
        socket.on('whiteboardshared',()=>{
            socket.to(roomId).emit('whiteboardshared');
        })
        socket.on('whiteboardclosed',()=>{
            socket.to(roomId).emit('whiteboardclosed');
        })
        
    })
});
server.listen(3000, (err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Connected!");
    }
})
