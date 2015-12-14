var output = require('./twitch/output');
var overlay = require('./../overlay/overlay');
var fn 	    = require('./functions');

function startVoting(channel, user, message) {
	global.votes  = [0,0];

	if (message.toLowerCase() === '!voting') {
		output.whisper(user.username, 'No voting option specified try [ !voting skip ]');
		return false;
	}
	if (message.toLowerCase() === '!voting rate') {
		overlay.emit('startRate');
		global.voting = true;
		global.ratings  = [];
		global.voters = [];
		votingRateController(channel, user, message);
	}
	if (message.toLowerCase() === '!voting skip') {
		global.voting = true;
		global.voters = [];
		overlay.emit('startSkip');	
		votingSkipController(channel, user, message);
	}
	else {
		return false;
	}
	
}

function voteCommandHandler(channel, user, message) 
{
	if (message.toLowerCase() === '!vote') {
		return false; // make sure an option is set
	}
	votingSkip(channel, user, message);
}

function votingSkip(channel, user, message) {

	if (message.toLowerCase().substr(0,5) === '!vote') {
		if (global.voters.indexOf(user.username) > -1) {
			return false;
		}

		var voteValue = fn.getNthWord(message, 2).replace(',','.');
		if (voteValue <= 10 && voteValue >= 0) {
			global.voters.push(user.username);
			global.ratings.push(voteValue);
		}
	}
	if (message.toLowerCase() == '!vote stay') {
		if (global.voters.indexOf(user.username) > -1) {
			return false;
		}
		global.votes[1] += 1;
		global.voters.push(user.username)
		
	}
	if (message.toLowerCase() == '!vote skip') {
		if (global.voters.indexOf(user.username) > -1) {
			return false;
		}
		console.log('skip voted');
		global.votes[0] += 1;
		global.voters.push(user.username)
	}
}

function votingSkipController(channel, user, message) {
	output.sayNoCD(channel, 'A skip or stay voting has been started type [ !vote skip ] or [ !vote stay ] to vote on the current content. The voting is over after 45 seconds ');
	
	setTimeout(function(){
		console.log(global.votes[0], global.votes[1]);
		overlay.emit('resultsSkip' + global.votes[0] + ',' + global.votes[1]);
		var totalVotes = Number(global.votes[0]) + Number(global.votes[1]);
		global.voting = false;
		output.sayNoCD(channel, '@' + user.username + ', The voting ended, skip: [ ' + global.votes[0] + ' ] | stay: [ ' + global.votes[1] + ' ] | votes: [ ' + totalVotes + ' ]');
	}, 45000);
}

function votingRateController(channel, user, message) {
	output.sayNoCD(channel, 'A rating voting has been started type [ !vote 5 ] (number from 0-10 with decimals) to rate the current content. The voting ends in 45 seconds.');
	
	setTimeout(function(){
		var avgRating = weightedAverage(global.ratings).toFixed(1);
		global.voting = false;
		output.sayNoCD(channel, '@' + user.username + ', The voting ended, the average ratings is: [ ' + avgRating + ' ] | votes: [ ' + global.ratings.length + ' ]');
		overlay.emit('resultsRate' + avgRating + ',' + global.ratings.length);
	}, 45000);
}

module.exports = 
{
	startVoting,
	voteCommandHandler
}