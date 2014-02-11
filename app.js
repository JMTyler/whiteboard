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

// Express
app.engine('html', ejs.renderFile);
app.use(express.bodyParser());
app.use(express.cookieParser());
// TODO: start using redis to persist sessions between app launches
app.use(express.session({secret: 'mysecretteehee123'}));
app.use(express.static(__dirname + '/public'));


//Modules
mw  = require('./modules/middleware.js');
xo  = require('./modules/xo-node.js');

//Models
require('./modules/models/user.js');
require('./modules/models/board.js');


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

var _inactiveUsers = {};
var _addUser = function(user) {
	if (typeof _inactiveUsers[user.id] != 'undefined') {
		return;
	}
	
	console.log('adding inactive user', user);
	_inactiveUsers[user.id] = {
		id: user.id,
		user: user
	};
};
var _activateUser = function(board, userId, socketId) {
	if (typeof _inactiveUsers[userId] == 'undefined') {
		if (typeof board.activeUsers[userId] == 'undefined') {
			console.log('could not find user to activate');
			return false;
		}
	}
	
	// If they're already in the list, just update it with their latest socket.
	if (typeof board.activeUsers[userId] != 'undefined') {
		var user = board.activeUsers[userId];
		user.socketIds.push(socketId);
		console.log('added socket to user');
		return false;
	}
	
	var user = _inactiveUsers[userId];
	//_inactiveUsers = _.without(_inactiveUsers, user);
	user.socketIds = [socketId];
	board.activeUsers[userId] = user;
	console.log('activated user');
	
	return true;
};
var _deactivateUserBySocketId = function(socketId) {
	for (var i in _activeUsers) {
		if (!_activeUsers.hasOwnProperty(i)) {
			continue;
		}
		
		if (_.indexOf(_activeUsers[i].socketIds, socketId) > -1) {
			var user = _activeUsers[i];
			console.log('found user to deactivate', user);
			if (user.socketIds.length == 1) {
				user.socketIds = [];
				_inactiveUsers[user.id] = user;
				_activeUsers = _.without(_activeUsers, user);
				console.log('removed user', user, _activeUsers);
				return user.id;
			}
			
			user.socketIds = _.without(user.socketIds, socketId);
			console.log('removed socket from user', user, _activeUsers)
			return null;
		}
	}
	
	console.log('could not find user by socket id');
	return null;//TODO throw
};


// Routes
app.get('/', function(req,res){
	// Hitting the base url should spin up a new board and redirect you to it
	Board.add({
		code: Board.generateCode(),
		name: "New Whiteboard"
	}, function(err, board) {
		if (err || !board) {
			res.end(render('oops.html'));
			return;
		}
		
		// TODO: Something about this breaks after second attempt (can't send headers)
		res.writeHead(302, {
			Location: '/' + board.code
		});
		res.end();
	});
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
		var code = new String(req.params).substring(1);
		Board.findByCode(code, function(err, board) {
			if (err || !board) {
				res.end(render('oops.html'));
				return;
			}
			
			mw.loadUser(req, res, function() {
				// TODO: Remember to make secret features using below code!
				//typeof req.query['with'] != 'undefined' && req.query['with'] == 'catbutt'
				_addUser(req.user);
				_activateBoard(board);
				res.end(render('index.html', {
					user_id: req.user.id,
					nickname: req.user.nickname
				}));
			});
		});
	}
});

var _activeBoards = {};
var _activateBoard = function(board) {
	if (typeof _activeBoards[board.code] != 'undefined') {
		return;
	}
	
	var activeBoard = {
		code: board.code,
		board: board,
		activeUsers: {}
	};
	console.log('spinning up \"' + activeBoard.code + '\"');
	
	io.of('/' + activeBoard.code)
		.on('connection', function(socket) {
			// TODO: something is breaking really weirdly about this... not sure what
			socket.on('new_user', function(data) {
				var isNewlyActivated = _activateUser(activeBoard, data.userId, socket.id);
				if (isNewlyActivated) {
					console.log('added socket id to this user', activeBoard.activeUsers[data.userId]);
					console.log('sending new connection down to existing users', activeBoard.activeUsers[data.userId].user.nickname);
					socket.broadcast.emit('new_user', {id: data.userId, nickname: activeBoard.activeUsers[data.userId].user.nickname});
				}
				
				// Suuuper basic way to load up a whiteboard's state when the user connects.
				// TODO: It's absurdly slow when there are many artifacts (unsurprisingly), so this must be improved. 
				for (var i in board.state) {
					if (!board.state.hasOwnProperty(i)) {
						continue;
					}
					socket.emit('draw', board.state[i]);
				}

				// TODO: Should have some kind of 'init' event, sending down everything the client needs on startup
				console.log('sending all active users down to new connection', activeBoard.activeUsers);
				for (var i in activeBoard.activeUsers) {
					if (!activeBoard.activeUsers.hasOwnProperty(i)) {
						continue;
					}
					socket.emit('new_user', {id: activeBoard.activeUsers[i].id, nickname: activeBoard.activeUsers[i].user.nickname});
				}
			});
			
			socket.on('draw', function(data) {
				board.state.push(data);
				board.save();
				socket.broadcast.emit('draw', data);
			});
			
			socket.on('disconnect', function() {
				// TODO: Figure out how to fix the many issues with this and re-enable it.
				return;
				
				console.log('removing user by socket id', socket.id);
				var userId = _deactivateUserBySocketId(socket.id);
				console.log('removed this user', userId);
				if (!userId) {
					return;
				}
				// TODO: is doesn't handle this gracefully if a user refreshes the page... they should NOT blip out from the list
				socket.broadcast.emit('user_disconnected', {id: userId});
			});
		});
	
	_activeBoards[board.code] = activeBoard;
};
