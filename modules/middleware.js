
exports.loadGif = function(req,res,next){
	Gif.findOne({id: req.gif_id}, function(err, gif){
		if(err || !gif){ return next(); }
		res.gif = gif;
		next();
	});
};

exports.getCategories = function(req,res,next){
	/*Category.find({}, 'name', function(err, categories){
		res.categories = _.map(categories, function(category){
			return category.name;
		});
		next();
	});*/
	Category.find({}, function(err, categories){
		if(err || !categories) return res.render('oops.html');
		res.categories = xo.clean(categories);
		next();
	});
};

var _generateUser = function(req, res, callback)
{
	callback = callback || function(){};
	
	User.add({
		nickname: User.generateNickname(),
		email: null
	}, function(err, user) {
		req.session.whiteboard_auth = {id: user.id};
		req.user = user;
		return callback(req, res);
	});
};

var _loadUser = function(req,res,callback){
	var auth = req.session.whiteboard_auth;
	if (!auth) {
		_generateUser(req, res, callback);
		return;
	}
	
	User.findOne({'id' : auth.id}, function(err, user){
		if(err || !user) {
			_generateUser(req, res, callback);
			return;
		}
		
		req.user = user;
		console.log('Logged in:', user.email);
		return callback(req,res);
	});
};


exports.loadUser = function(req,res,next){
	next = next || function(){};
	
	_loadUser(req,res,function(){
		next();
	});
};


exports.adminOnly = function(req,res,next){
	_loadUser(req,res, function(req,res){
		if(req.user){
			if(req.user.account_type === 'admin'){
				console.log('Admin valided');
				return next();
			}
		}
		return res.send(401, "Admin only");
	});
};

exports.matchUser = function(req,res,next){
	_loadUser(req,res, function(req,res){
		if(req.user){
			if(req.user.account_type === 'admin' || req.user.id === req.params.id){
				return next();
			}
		}
		return res.send(401, "Unauthorized user");
	});
};

exports.forceLogin = function(req,res,next){
	_loadUser(req,res, function(req,res){
		if(!req.user){
			return res.redirect('/signup');
		}
		return next();
	});
};

exports.forceUser = function(req,res,next){
	_loadUser(req,res, function(req,res){
		if(!req.user){
			return res.send(401, 'No user');
		}
		return next();
	});
};

