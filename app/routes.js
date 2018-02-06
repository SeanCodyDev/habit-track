//START CUSTOMIZATION

var Post       = require('../app/models/posts');
var User       = require('../app/models/user');
var Question   = require('../app/models/questions');
const moment = require('moment');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
let tips = require('./tips');
var mongoose = require('mongoose');




const HABIT_LIST = [
    {name: "stress",
    question: "stress question"},
    {name: "water",
    question: "Did you drink at least 64oz of water today?"},
    {name: "sleep",
    question: "Did you get at least 6 hours of sleep last night?"},
    {name: "exercise",
    question: "Did you get in some non-exercise motion today?"},
    {name: "nutrition",
    question: "Did you eat 6 small meals today?"}];


//choosehabit loops over the answers in req.body; if the question answered has a specific category, then that habit score is incremented.
//Scores are kept in an object with habit: score pairs
//'data' includes just an object with key:value pairs 'name':'score'
function chooseHabit(data){
    let highScorehabit;
    let habitScores = {};

    for (let i=0; i<HABIT_LIST.length; i++){
        //initialize key values as numbers
        habitScores[HABIT_LIST[i]["name"]] = 0;

        for (var key in data) {
            if (key.includes(HABIT_LIST[i]["name"])){

                habitScores[HABIT_LIST[i]["name"]] += parseInt(data[key]);

            }     
        }
        //check habitScore[i] against other habit scores and set highScoreHabit
        highScorehabit = Object.keys(habitScores).reduce(function(a, b){ return habitScores[a] > habitScores[b] ? a : b });
    }

    console.log(habitScores, highScorehabit);
    return highScorehabit;
}



module.exports = function(app, passport) {

    //this route updates the user's document's answers from their initial health assessment
    app.post('/submit-quiz', isLoggedIn, function(req, res){
        // console.log(req.body);
        let userUpdates =  {
                    "quiz.status":true,
                    "quiz.questions": req.body,
                    "habit.startDate": moment().format('MMMM Do YYYY, h:mm:ss a')
                };
        console.log(userUpdates);
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

            res.redirect('/profile') 
        });
    });

    //this route renders the 'choose-habit' page
    app.get('/choose-habit', isLoggedIn, function (req, res) {
        res.render('choose-habit.ejs', {user : req.user, habits: HABIT_LIST});

    });

    //updates the current user with the habit chosen on '/choose-habit'
    app.post('/choose-habit', isLoggedIn, function (req, res) {
        console.log(req.body)
        console.log('Choosing Habit:')
        console.log(req.body.chooseHabit);
        User.update(
            {_id:req.user._id}, 
            {$set: 
                { 
                    "habit.currentHabit": req.body.chooseHabit,
                    //if the user selects the same habit they are currently on, this should not change
                    "habit.startDate": moment().format('MMMM Do YYYY, h:mm:ss a')
                }
            }, function(result){ 

            res.redirect('/profile') 
        });
    });


    //Post Questions to the database
    //ISSUE: modify so that this can only be modified by a site admin
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

    //renders profile page
    //ISSUE: are any messages needed in the User.update method?
    //updates user's daysOnHabit
    //if the user has skipped a day, the currentStreak should be reset 
    app.get('/profile', isLoggedIn, (req, res) => {


        let daysOnHabit = Math.ceil((Date.now()-Number(req.user.habit.startDate))/86400000);

        //if the user has already updated their currentDay today, the user submit form is hidden
        //this is repeated in app.post('/current-day',...)
        let lastUpdated = req.user.habit.lastUpdated;
        let today = moment().format('MMMM Do YYYY');
        console.log(lastUpdated);
        console.log(today);

        //dateCheck is true if the currentDay has already been updated today
        let dateCheck = lastUpdated == today;
        console.log("date check is", dateCheck);

        
        Question.find()
        .then(results => {
        
            let dailyHabit = req.user.habit.currentHabit;
            let tip;
            let habitQuestion;
            // console.log(req.user);
            // console.log(tips[dailyHabit][Math.floor(Math.random()*tips[dailyHabit].length)]);
            
            if (dailyHabit){
                tip = tips[dailyHabit][Math.floor(Math.random()*tips[dailyHabit].length)]
            } 

            //loop through HABIT_LIST to set the daily question
            // console.log(dailyHabit);
            for (let i=0;i<HABIT_LIST.length;i++) {
                if (dailyHabit == HABIT_LIST[i]["name"]) {
                    habitQuestion = HABIT_LIST[i]["question"];
                    break;
                } else {
                    habitQuestion = "You still need to choose a habit";
                }
            }

            res.render('profile.ejs', {user : req.user, questions: results, tip: tip, daysOnHabit: daysOnHabit, habitQuestion: habitQuestion, dateCheck: dateCheck});


        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error'});
        });


    });


    //submits the user's YES/NO input for their current day habit tracking
    //uses User.update() to update the users currentStreak to either increment it or reset it
    //if the currentStreak exceeds the bestStreak, bestStreak will be updated
    app.post('/current-day', isLoggedIn, (req, res) => {
        // console.log(req.user);

        //if the user has already updated their currentDay today, the user submit form is hidden
        let lastUpdated = req.user.habit.lastUpdated;
        let today = moment().format('MMMM Do YYYY, h:mm:ss a');
        let dateCheck = moment(lastUpdated).isBefore(today, 'day');

        //update bestStreak if applicable
        //obsolete
        // let bestStreakUpdate;
        // if (req.user.habit.bestStreak > req.user.habit.currentStreak) {
        //     bestStreakUpdate = req.user.habit.bestStreak;
        // } else {
        //     bestStreakUpdate = req.user.habit.currentStreak + 1;
        // };

        // console.log(bestStreakUpdate);

        User.findOne({_id: req.user._id}, function (err, user) {
            console.log(user)
            user.habit.currentStreak++;

            user.habit.bestStreak = Math.max(user.habit.bestStreak, user.habit.currentStreak);
            user.habit.lastUpdated = moment().format('MMMM Do YYYY');
            console.log(user);

            user.save(function (err) {
                if(err) {
                    console.error('ERROR!');
                }
                res.json(user)
            });
        });

        // if (req.body.dailyHabit == "true") {
        //     let updatedTime = moment().format('MMMM Do YYYY, h:mm:ss a');

            // User.findAndModify(
            // {_id:req.user._id}, 
            // {$inc: 
            //     { 
            //         "habit.currentStreak": 1
            //     },
            // $set:
            //     {
            //         "habit.bestStreak": bestStreakUpdate,
            //         "habit.lastUpdated": updatedTime
            //     }
            // }, function(result){ 
            //     //return the currentStreak and bestStreak for updating the DOM
            //     console.log(result);

            //     res.json('findAnd Modify test'); 

        //     User.update(
        //     {_id:req.user._id}, 
        //     {$inc: 
        //         { 
        //             "habit.currentStreak": 1
        //         },
        //     $set:
        //         {
        //             "habit.bestStreak": bestStreakUpdate,
        //             "habit.lastUpdated": updatedTime
        //         }
        //     }, function(result){ 
        //         //return the currentStreak and bestStreak for updating the DOM
        //         console.log(result);
        //         res.json(req.user); 
        // });



        // } else {
        //     User.update(
        //         {_id:req.user._id}, 
        //         {$set: 
        //             { 
        //                 "habit.currentStreak": 0,
        //                 "habit.lastUpdated": updatedTime

        //             }
        //         }, function(result){ 
        //             //return the currentStreak and bestStreak for updating the DOM
        //             console.log(result);
        //             res.json(req.user); 
        //     });
        // }
    });



// END CUSTOMIZATION

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

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
