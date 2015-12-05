var fs     = require('graceful-fs');
var fn     = require('./functions');
var output = require('./twitch/output');

global.quoteCounter = 0;

function quoteCommandHandler(channel, user, message)
{
	if (message.toLowerCase() !== '!randomquote') {
		userToQuote = fn.getNthWord(message, 2);
		randomQuoteFromUser(channel, user, message, userToQuote);
	}
}

function randomQuoteFromUser(channel, user, message, userToQuote) 
{
	userToQuote = userToQuote.toLowerCase();
	userFile = 'logs/' + channel.substr(1) + '/' + userToQuote + '.txt';
	fs.exists(userFile, function (exists) {
        if (fn.getFilesizeInKilobytes(userFile) < 10) {
			return false;
		}
        if(exists){
            fs.readFile(userFile, function (err, data) {
				if (err) {
					output.say(userToQuote + ' has no logs here')
				}
		    	logsSplit = data.toString().split("\n");      
		        quote = logsSplit[Math.floor(Math.random()*logsSplit.length)];
		        quote = quote.split(']');
		        quote = quote[1];

		        if (quote.length < 10 || quote.length > 150 || fn.stringContainsUrl(quote)) {
		        	global.quoteCounter++;
		        	if (global.quoteCounter > 9) {
		        		global.quoteCounter = 0;
		        		return false;
		        	}
		        	console.log('[LOG] skipped user quote');
		        	randomQuoteFromUser(channel, user, message, userToQuote);
		        	return false;
		        }
		        output.say(channel, '"' + quote + ' "');
		    });
        } else {
            console.log('[ERROR] ' + userToQuote + ' has no logs')
        }
    });
	
	
}


module.exports = 
{
	quoteCommandHandler
}