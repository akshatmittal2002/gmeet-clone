module.exports.loginRequired = function(req,res,next){
    
    if(req.isAuthenticated()){
        next();
    }
    else{
        req.flash('failure', 'You have to login inorder to get access to this page!');
        res.redirect('/user/login');
    }

}