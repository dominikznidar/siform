var SiForm = Class.create({
	// initialize SiForm
	initialize: function(element, options) {
		this.element = element;
		if (!this.setOptions(options)) return false;
		this.element.update(this.buildForm());
	},

	// set options, check for default values
	setOptions: function(options) {
		if (!options.displayType) options.displayType = 'list';
		this.options = options;
		return true;
	},

	// build form
	buildForm: function() {
		return "SiForm form";
	},
	
	// 
	
	// throw error
	error: function(errMsg) {
		alert("SiForm error :: "+errMsg);
	}

});