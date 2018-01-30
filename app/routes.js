//START CUSTOMIZATION

var Post       = require('../app/models/posts');
var User       = require('../app/models/user');
var Question   = require('../app/models/questions');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();



const HABIT_LIST = ["stress", "water", "sleep", "exercise", "nutrition"];


//choosehabit loops over the answers in req.body; if the question answered has a specific category, then that habit score is incremented.
//Scores are kept in an object with habit: score pairs
//'data' includes just an object with key:value pairs 'name':'score'
function chooseHabit(data){
    let highScorehabit;
    let habitScores = {};

    for (let i=0; i<HABIT_LIST.length; i++){
        //initialize key values as numbers
        habitScores[HABIT_LIST[i]] = 0;

        for (var key in data) {
            if (key.includes(HABIT_LIST[i])){

                habitScores[HABIT_LIST[i]] += parseInt(data[key]);

            }     
        }
        //check habitScore[i] against other habit scores and set highScoreHabit
        highScorehabit = Object.keys(habitScores).reduce(function(a, b){ return habitScores[a] > habitScores[b] ? a : b });
    }

    console.log(habitScores, highScorehabit);
    return highScorehabit;
}

//generic function to count how many days since user has started a habit
function upTime(countTo) {
  
  now = new Date();
  countTo = new Date(parseInt(countTo));
  difference = (now-countTo);

  days=Math.floor(difference/(60*60*1000*24)*1+1);

  return days;  
}


module.exports = function(app, passport) {



    //this route updates the user's document's answers from their initial health assessment
    app.post('/submit-quiz', isLoggedIn, function(req, res){
        console.log(req.body);
        let userUpdates =  {
                    "quiz.status":true,
                    "quiz.questions": req.body,
                    "habit.startDate": Date.now()
                };
        //analyze and recommend habit (can this be written in a separate function?)
        userUpdates["habit.currentHabit"] = chooseHabit(req.body);
        User.update(
            {_id:req.user._id}, 
            {$set: userUpdates
                // { 
                //     "quiz.status":true,
                //     "quiz.questions": req.body
                // }
            }, function(result){ 

            res.redirect('/choose-habit') 
        });
    });

    //this route renders the 'choose-habit' page
    app.get('/choose-habit', isLoggedIn, function (req, res) {
        // let habits = ["Stress", "Water", "Sleep", "Nutriton", "Exercise"];
        res.render('choose-habit.ejs', {user : req.user, habits: HABIT_LIST});

    });

    //this route updates the current user with the habit chosen on '/choose-habit'
    app.post('/choose-habit', isLoggedIn, function (req, res) {
        console.log(req.body);
        User.update(
            {_id:req.user._id}, 
            {$set: 
                { 
                    "habit.currentHabit": req.body.chooseHabit,
                    //if the user selects the same habit they are currently on, this should not change
                    "habit.startDate": Date.now()
                }
            }, function(result){ 

            res.redirect('/profile') 
        });
    });

// OBSOLETE? =======
    // app.post('/post', function(req, res) {
    //     console.log(req.body);
    //     let p = new Post(req.body);
    //     p.save(function(err){
    //         res.redirect('/');

    //     });
    // });

    app.get('/', function(req, res) {
        Post.find().exec().then(results => {
            console.log(results);
            res.render('index.ejs', {posts: results});

        }).catch(err => { 
            throw err
        });

    });

    //POST QUESTIONS
    app.post('/questions', jsonParser, (req, res) => {
        console.log(req.body);
        const requiredFields = ['text', 'answers', 'answerType', 'name'];
        for (let i=0; i<requiredFields.length; i++){
            const field = requiredFields[i];
            if (!(field in req.body)){
                const message = `Missing \`${field}\` in request body`;
                console.error(message);
                return res.status(400).send(message);
            }
        }

        Question 
            .create({
                text: req.body.text,
                answers: req.body.answers,
                answerType: req.body.answerType,
                name: req.body.name
            })
            .then(results => {
                res.status(201).json(results);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            });
    });

    app.get('/profile', isLoggedIn, (req, res) => {

        //update days on habit
        User.update(
            {_id:req.user._id}, 
            {$set: 
                { 
                    "habit.daysOnHabit": upTime(req.user.habit.startDate)
                }
            }, function(result){ 

        });

        Question.find()
        .then(results => {
            res.render('profile.ejs', {user : req.user, questions: results});


        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error'});
        });


    });


// END CUSTOMIZATION

// normal routes ===============================================================

    // show the home page (will also have our login links)
    // app.get('/', function(req, res) {
    //     res.render('index.ejs');
    // });

    // PROFILE SECTION =========================
    // app.get('/profile', isLoggedIn, function(req, res) {
    //     res.render('profile.ejs', {
    //         user : req.user
    //     });
    // });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
