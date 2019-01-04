const cache = {};

module.exports = {
	start: function(name) {
		cache[name] = new Date().getTime();
	},
	end: function(name) {
		return new Date().getTime() - cache[name];
	}
};