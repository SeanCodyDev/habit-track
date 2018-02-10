'use strict';

const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
	text: String,
		// text: {type: String, required: true},

	answers: Array,
	answerType: String,
	//name of the question
	name: String,
	category: String
});


// create the model for questions and expose it to our app
module.exports = mongoose.model('Question', questionSchema);
