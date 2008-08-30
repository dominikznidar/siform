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
		console.info(formElements);
		var formButtons = this.getFormButtons();
		if (this.options.displayType == 'table') {
			wrapper = ["table", { cellpadding: 0, cellspacing: 0 }, [
				["tbody", {}, [].concat(formElements, formButtons) ]
			]];
		} else {
			wrapper = ["ul", {}, [].concat(formElements, formButtons)];
		}
		return this.createElement("form", { action: this.options.formOptions.action }, [wrapper]);
	},
	
	getFormElements: function() {
		var elements = [];
		for (i=0, len=this.options.elements.length; i<len; ++i) {
			elOptions = this.options.elements[i];
			if (element = SiForm.Elements[elOptions.type]) {
				elements.push(this.labelElement(element(elOptions), elOptions));
			}
		}
		return elements;
	},
	
	getFormButtons: function() {
		return [["ul", { className: 'buttons' }]];
	},
	
	labelElement: function(element, elementOptions) {
		label = ["label", { for: "f_"+elementOptions.name }];
		if (this.options.displayType == "table") {
			return ["tr", {}, [
				["td", {}, [label]],
				["td", {}, [element]]
			]];
		} else {
			return ["li", {}, [label, element]];
		}
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
			console.log(tagName, childNodes.length);
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