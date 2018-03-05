// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '1206478409483922', // your App ID
        'clientSecret'    : 'f8ac1b5d1a12cd8132374402983487d6', // your App Secret
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback',
        'profileURL'      : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields'   : ['id', 'email', 'name'] // For requesting permissions from Facebook API

    },

    'twitterAuth' : {
        'consumerKey'        : 'your-consumer-key-here',
        'consumerSecret'     : 'your-client-secret-here',
        'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : '799062823296-2ulqtrp2b1g9ei6gbt1deraujcoeunfe.apps.googleusercontent.com',
        'clientSecret'     : 'h6RLwBtpmPsfYI8R2vTQW-ZW',
        'callbackURL'      : 'http://localhost:8080/auth/google/callback'
    }

};
