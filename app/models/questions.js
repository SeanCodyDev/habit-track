'use strict';

const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
	text: {type: String, required: true}
	// ,
	// answers: {
	// 	required: true,
	// 	ans1: String,
	// 	ans2: String,
	// 	ans3: String,
	// 	ans4: String
	// },
	// answerType: {type: String, required: true}
});

// create the model for questions and expose it to our app
module.exports = mongoose.model('Question', questionSchema);