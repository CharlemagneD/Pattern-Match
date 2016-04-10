// Referenced from Strongloop and given template pdf
var transform  = require('stream').Transform
var util = require('util').inherits
var fs = require('fs')
// Used for program module
var program = require('commander') 

if(!transform) {
    transform  = require('readable-stream/transform')
}

// Constructor logic includes Internal state logic. 
// PatternMatch needs to consider it because it has to parse chunks that gets transformed
function PatternMatch(pattern) { 
    // Switching on object mode so when stream reads sensordata it emits single pattern match.
    transform.call(
    	this, 
    	{ 
    		objectMode: true 
    	});
    this.pattern = pattern
}

// Extend the Transform class.
// --
// NOTE: This only extends the class methods - not the internal properties. 
// As such we have to make sure to call the Transform constructor(above).

util(PatternMatch, transform);

PatternMatch.prototype._transform = function(chunk, encoding, done) { 
    var data = chunk.toString();
    this.push( 'INPUT:' ); 
    this.push( data ); 
    var parse = data.split(this.pattern)
    
    this._lastLineData = parse.splice( parse.length-1, 1)[0] 
    
    this.push('OUTPUT:');
    for(var i in parse) {
		this.push(parse[i]) 
    }
    done()  
}
// After stream has been read and transformed, the _flush method is called. 
// It is a great place to push values to output stream and clean up existing data

PatternMatch.prototype._flush = function(flushCompleted) { 
	// Referenced from Strongloop
    if(this._lastLineData) this.push( this._lastLineData )
    this._lastLineData = null
    flushCompleted() 
}

// Program module is for taking command line arguments
program
    .option('-p, --pattern <pattern>', 'Input Patterns such as . ,') 
    .parse(process.argv)

// Create an input stream from the file system.
var inputStream = fs.createReadStream('input-sensor.txt') 

// Create a Pattern Matching stream that will run through the input and find matches 
// for the given pattern at the command line - "." and “,”.
var patternStream = inputStream.pipe(new PatternMatch(program.pattern))

// Referenced from Strongloop
// Read matches from the stream.
patternStream.on( 'readable', function() { 
    var line 
    while(null !== (line = this.read())){   
		console.log(line.toString())
    } 
})
