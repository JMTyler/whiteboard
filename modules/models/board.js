
var mongoose = require('mongoose');

var ErrorCode = {
	0 : 'Could not find unique User',
	1 : 'User already exists',
	2 : 'Malformed query'
};

BoardSchema = mongoose.Schema({
	id : String,
	name : String,
	code : String,
	date  : { type: Date, 'default': Date.now }
});


//Methods
/*UserSchema.methods.isAdmin = function(){
	return this.account_type === 'admin';
};

UserSchema.methods.addCookie = function(cookieSignature, callback){ //TODO: Make into an update
	this.auth.push({
		cookie      : cookieSignature
	});
	this.save(callback);
};


//Adds a new user, checks if we should make them an admin
UserSchema.statics.add = function(data, callback){
	var newUser = new User(data);
	if(!newUser.id) newUser.id = newUser._id;
	if(_.contains(adminEmails, newUser.email)){
		newUser.account_type = 'admin';
	}
	return newUser.save(callback);
};

UserSchema.statics.generateNickname = (function() {
	var firstNames = ['Bill', 'Brian', 'Jared', 'Kate', 'Kellen',
		'Megan', 'Nate', 'Scott', 'Wyatt'
	], lastNames  = ['Curtis', 'Crockford', 'Tyler', 'Palser', 'Steffen',
		'Kirkland', 'Morse', 'Tolksdorf', 'Carss'
	], nicknames  = ['The Foregoing', 'The Divergent', 'The Supreme', 'The Invincible', 'The Foolish',
		'The Steadfast', 'The Miscreant', 'The Dynamic', 'The Alcoholic', 'The Fabulous',
		'The Ambiguous', 'The Resonant', 'The Vengeful', 'The Eminent', 'The Industrious'
	];
	return function() {
		var firstName = firstNames[Math.floor(Math.random() * firstNames.length)],
			lastName  = lastNames[Math.floor(Math.random() * lastNames.length)],
			nickname  = nicknames[Math.floor(Math.random() * nicknames.length)];
		return firstName + ' "' + nickname + '" ' + lastName;
	};
})();

UserSchema.post('save', function(user){
	if(!user.id) user.id = user._id;
	user.update({id : user.id}, function(err){});
});


//returns the user if the email exists, if not adds the user and returns in
UserSchema.statics.getByEmail = function(email, callback){
	var self = this;
	User.findOne({email : email}, function(err, user){
		if(err){
			return callback(err);
		}
		if(!user){
			return self.add({email : email}, callback);
		}
		return callback(null, user);
	});
};*/

BoardSchema.statics.add = function(data, callback){
	var newBoard = new Board(data);
	if(!newBoard.id) newBoard.id = newBoard._id;
	return newBoard.save(callback);
};

BoardSchema.statics.generateCode = (function() {
	var mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return function() {
		var code = '';
		for (var i = 0; i < 5; i++) {
			code += mask[Math.floor(Math.random() * mask.length)];
		}
		return code;
	};
})();

BoardSchema.statics.findByCode = function(code, callback) {
	Board.findOne({code: code}, function(err, board) {
		if (err || !board) {
			return callback(err);
		}
		
		return callback(null, board);
	});
};

Board = mongoose.model('Board', BoardSchema);

//xo.api('/api/users', User, [mw.adminOnly]);
