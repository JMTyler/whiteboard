ThingModel = xo.model.extend({
	URL : function(){
		return "/api/thing"
	},

	match : function(terms){
		var self = this;
		if(typeof terms === 'string'){
			terms = [terms];
		}

		var contains = function(str, target){
			if(typeof str !== 'string'){ return false;}
			return str.toLowerCase().indexOf(target.toLowerCase()) !== -1;
		}

		//Search through the title, description, group and keywords to match each term
		var found = util.every(terms, function(term){
			return util.some(self.tags, function(tag){
				return contains(tag, term);
			})	|| contains(self.category, term)
				|| contains(self.user, term)
		});

		this.trigger('matched', found);
		return found;
	},

})