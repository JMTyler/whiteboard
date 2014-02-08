ThingCollection = xo.collection.extend({
	model : ThingModel,

	search : function(terms){
		var result = util.reduce(this.models, function(result, thing){
			if(thing.match(terms)) result.push(thing);
			return result;
		}, []);
		return result;
	},
});