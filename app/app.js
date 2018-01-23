//this file is currently unused, but was what I pictured using for a client-side handling of the initial health assessment

//----- HABIT ASSESSMENT -----

// Array containing questions, answers, and answer types to be dynamically loaded in assesment box
// these are hardcoded here for basic testing, but later implementation will have these in a 'questions' database collection

const ASSESSMENT_QUESTIONS = [
	{
		question: "How many ounces of water do you typically drink daily?",
		answers: ["Less than 40", "40-60", "60-80", "More than 80"],
		answerType: "radio"
	},
	{
		question: "What other beverages do you drink regularly (choose all that apply)?",
		answers: ["Alcohol (more than 3 weekly)", "Coffee", "Tea", "Soda or Energy Drinks"],
		answerType: "checkbox"
	}
];

// Handles what happens when the 'Start Assessment' button is clicked
function handleAssessmentClick(){
	$('.start-assessment-button').on('click', event => {
	    event.preventDefault();
	    console.log('`handleAssessmentClick` ran');
	    // let quizBoxInput = updateQuestion(currentQuestionIndex);
	    // updateQuizBox(quizBoxInput);
	  });
	updateQuestion();
}

// updates the question in the Assessment box after the assessment is started and each question is submitted
function updateQuestion(currentQuestionIndex){
  console.log('`updateQuestion` ran');
  
  //hardcoded, but answers should be created by looping over the possible answers
  const currentQuestion = `
  <form id="js-question">
    <h2>${ASSESSMENT_QUESTIONS[0].question}?</h2><br>
    <fieldset name="answer options">
      <input type="${ASSESSMENT_QUESTIONS[0].answerType[0]}" name="capital" value="${ASSESSMENT_QUESTIONS[0].answers[0]}"> ${ASSESSMENT_QUESTIONS[0].answers[0]}<br>
      <input type="${ASSESSMENT_QUESTIONS[0].answerType[1]}" name="capital" value="${ASSESSMENT_QUESTIONS[0].answers[0]}"> ${ASSESSMENT_QUESTIONS[0].answers[1]}<br>
      <input type="${ASSESSMENT_QUESTIONS[0].answerType[2]}" name="capital" value="${ASSESSMENT_QUESTIONS[0].answers[0]}"> ${ASSESSMENT_QUESTIONS[0].answers[2]}<br>
      <input type="${ASSESSMENT_QUESTIONS[0].answerType[3]}" name="capital" value="${ASSESSMENT_QUESTIONS[0].answers[0]}"> ${ASSESSMENT_QUESTIONS[0].answers[3]}<br>
    </fieldset>
    <button class="js-submit-answer-button" type="submit">Submit</button>
  </form>`;
  // console.log(currentQuestion);
  return currentQuestion;
}

// handles what happens when the question "Submit" button is clicked
function handleSubmitClick(){

//if last question
	evaluateAssessment();
	assessmentFeedback();

}

// function takes question answers and determines a recommended habit
function evaluateAssessment(){

}

// displays feedback after the assessment is finished
function assessmentFeedback(){


}

// handles what happens when a habit button is clicked
function handleHabitClick(){

	selectHabit();
}

// updates users 'current habit'

function selectHabit(){

}

