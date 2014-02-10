// Globals
GLOBAL.fs       = require('fs');
GLOBAL._        = require('underscore');
GLOBAL.express  = require("express");
GLOBAL.app      = express();
GLOBAL.ejs      = require('ejs');
GLOBAL.server   = require('http').createServer(app);
GLOBAL.io       = require('socket.io').listen(server);

//Mongoose
mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/whiteboard';
mongoose.connect(mongoUri);
mongoose.connection.on('error', function(){
	console.log(">>>ERROR: Run Mongodb.exe ya goof!");
});

//Modules
mw  = require('./modules/middleware.js');
xo  = require('./modules/xo-node.js');

//Models
require('./modules/models/user.js');

// Express
app.engine('html', ejs.renderFile);
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(__dirname + '/public'));


// Web server
var port = process.env.PORT || 80;
server.listen(port, function() {
	console.log("Listening on " + port);
});

// Renders HTML file with layout.ejs
var render = function(htmlFile, vars){
	var tempRender = ejs.render(fs.readFileSync(__dirname + '/views/' + 'layout.ejs','utf8'), {
		body : fs.readFileSync(__dirname + '/views/' + htmlFile,'utf8'),
	});
	return ejs.render(tempRender, vars);
};


// Routes
app.get('/', function(req,res){
	// TODO: Remember to make secret features using below code!
	//typeof req.query['with'] != 'undefined' && req.query['with'] == 'catbutt'
	res.end(render('index.html'));
});

/*app.get('/thing/:thingid', function(req,res){
	Things.findById(req.params.thingid, function(err, thing){
		if(err || !thing) return res.send(500, "Can't find thing");
		res.end(render('thingPage.html', {
			thing : JSON.stringify(thing)
		}));
	});
});*/

app.get('*', function(req,res){
	// TODO: Doing this in here because suddenly this 404 started overriding any script/asset URLs.  Not sure what happened.  Ping Scott, he might have an idea.
	try {
		// TODO: better yet, try to find access to req._parsedUrl.pathname
		var content = fs.readFileSync(__dirname + '/public' + req.params, 'utf8');
		res.end(content);
	} catch (e) {
		res.end(render('oops.html'));
	}
});


//Socket server
io.sockets.on('connection', function(socket) {
	socket.on('draw', function(data) {
		socket.broadcast.emit('draw', data);
	});
});
