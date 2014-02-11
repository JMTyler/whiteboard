
var mongoose = require('mongoose');

var ErrorCode = {
	0 : 'Could not find unique User',
	1 : 'User already exists',
	2 : 'Malformed query'
};

var adminEmails = [
	'jared@jaredtyler.ca'
];


UserSchema = mongoose.Schema({
	id : String,
	nickname : String,
	email : String,
	account_type : { type: String, 'default': 'beta'},
	date  : { type: Date, 'default': Date.now }
});


//Methods
UserSchema.methods.isAdmin = function(){
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
};


User = mongoose.model('User', UserSchema);

xo.api('/api/users', User, [mw.adminOnly]);
