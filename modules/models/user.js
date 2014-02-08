var mongoose = require('mongoose');


var ErrorCode = {
	0 : 'Could not find unique User',
	1 : 'User already exists',
	2 : 'Malformed query'
};

var adminEmails = [
	'nathaniel.howlett@gmail.com',
	'nathaniel.howlett@investorsgroup.com',
	'scott.tolksdorf@gmail.com',
	'scott@prestocalc.com',
	'nate@prestocalc.com'
];


UserSchema = mongoose.Schema({
	id : String,
	email : String,
	account_type : { type: String, default: 'beta'},
	auth : [{
		cookie      : String
	}],
	date  : { type: Date, default: Date.now },
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

UserSchema.post('save', function(user){
	if(!user.id) user.id = user._id;
	user.update({id : user.id}, function(err){});
});


//returns the user if the email exists, if not adds the user and returns in
UserSchema.statics.getByEmail = function(email, callback){
	var self = this;
	User.findOne({email : email}, function(err, user){
		if(err){
			return callback(err)
		}
		if(!user){
			return self.add({email : email}, callback);
		}
		return callback(null, user);
	});
}


User = mongoose.model('User', UserSchema);

xo.api('/api/users', User, [mw.adminOnly]);