var SiForm = Class.create({
	requiredFields: [],
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
		var formElements = this.getFormElements();
		var formButtons = this.getFormButtons();
		console.info(formElements);
		return this.createElement("form", { action: this.options.formOptions.action }, [].concat(formElements, formButtons));
	},
	
	getFormElements: function() {
		var elements = [];
		for (i=0, len=this.options.elements.length; i<len; ++i) {
			if (element = SiForm.Elements[this.options.elements[i].type]) {
				console.info(element);
				elements.push(element((this.options.elements[i])));
			}
		}
		return elements;
	},
	
	getFormButtons: function() {
		return [["ul", { className: 'buttons' }]];
	},

	// create element
	createElement: function() {
		var c = "", args = arguments, tagName = "", attributes = {}, childNodes = [];
		if (!args.length) return "";
		childNodes = args[2] || [];
		attributes = args[1];
		tagName = args[0];
		c = "<"+tagName;
		if (attributes) {
			$H(attributes).each(function(pair) { c+=" "+(pair[0]!='className'?pair[0]:'class')+"=\""+pair[1]+"\""; });
		}
		c+= ">";
		if (childNodes.length && Object.isArray(childNodes)) {
			for (i=0, len=childNodes.length; i < len; ++i) c+= this.createElement(childNodes[i][0], childNodes[i][1], childNodes[i][2]);
		}
		c+= "</"+tagName+">";
		return c;
	},
	
	// throw error
	error: function(errMsg) {
		alert("SiForm error :: "+errMsg);
	}

});

SiForm.Elements = {
	textfield: function(options) {
		// set default options
		options = Object.extend({
			name: '',
			value: '',
			validations: false,
			tip: ''
		}, options || {});

		// build element
		return ['input', { name: options.name, value: options.value, id: 'f_'+options.name }];
	}
};