const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
router.get('/register', (req, res) => {
    res.render('register.ejs');
})
router.post('/register',async function (req, res) {

    const user = new User({username: req.body.username,email: req.body.email});

    registeredUser = await User.register(user,req.body.password);

    req.login(registeredUser,(err)=>{

        if(err){
            console.log(err);
        }
        res.redirect('/');

    })
    
});
router.get('/login',(req,res)=>{
    res.render('login');
});
router.post('/login',passport.authenticate('local',{failureRedirect: '/user/login', failureFlash: true}),function(req,res){
    // console.log(passport);

    req.flash('success', 'You have successfully logged in');
    res.redirect('/');
} );
router.get('/logout',(req,res)=>{
    req.logout( function(err){
        req.flash('success', 'You have successfully logged out!');
        res.redirect('/');
    });
})
router.get('/schedule')
module.exports = router;