var SiForm = Class.create({
	validations: [],
	// initialize SiForm
	initialize: function(element, options) {
		this.element = element;
		this.options = Object.extend({
			displayType: "list",
			formOptions: {},
			info: "",
			buttons: [],
			elements: []
		}, options || {});
		this.options.formOptions = Object.extend({
			id: "",
			action: "",
			method: "post"
		}, this.options.formOptions);
		if (!this.options.formOptions.id) this.options.formOptions.id = "siform_"+Math.round(Math.random()*100000);
		this.element.update(this.buildForm());
		
	},

	// build form
	buildForm: function() {
		var formElements = this.getFormElements(this.options.elements);
		var formButtons = this.getFormButtons();
		if (this.options.displayType == 'table') {
			wrapper = ["table", { cellpadding: 0, cellspacing: 0 }, [
				["tbody", {}, [].concat(formElements, formButtons) ]
			]];
		} else {
			wrapper = ["ul", {}, [].concat(formElements, formButtons)];
		}
		return this.createElement("form", { 
			action: this.options.formOptions.action,
			method: this.options.formOptions.method,
			id: this.options.formOptions.id,
			onSubmit: "console.log($F('"+this.options.formOptions.id+"'))"
		}, [wrapper]);
	},
	
	getFormElements: function(els) {
		var elements = [];
		for (i=0, len=els.length; i<len; ++i) {
			elOptions = els[i];
			if (element = SiForm.Elements[elOptions.type]) {
				elements.push(this.labelElement(element(elOptions), elOptions));
				if (elOptions.validations) {
					if (Object.isString(elOptions.validations)) this.addValidation(elOptions.name, elOptions.validations);
					else {
						for (var j=0,valc=elOptions.validations.length; j<valc; ++j) {
							this.addValidation(elOptions.name, elOptions.validations[j]);
						}
					}
				}
			}
		}
		return elements;
	},
	
	getFormButtons: function() {
		return [["ul", { className: 'buttons' }]];
	},
	
	labelElement: function(element, elementOptions) {
		label = ["label", { htmlFor: "f_"+elementOptions.name }, [elementOptions.title]];
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
			$H(attributes).each(function(pair) { c+=" "+(pair[0]!="className"?(pair[0]!="htmlFor"?pair[0]:"for"):"class")+"=\""+pair[1]+"\""; });
		}
		c+= ">";
		if (childNodes.length && Object.isArray(childNodes)) {
			for (var i=0, len=childNodes.length; i < len; ++i) {
				if (Object.isString(childNodes[i])) {
					c+= childNodes[i];
				} else {
					c+= this.createElement(childNodes[i][0], childNodes[i][1], childNodes[i][2]);
				}
			}
		}
		c+= "</"+tagName+">";
		return c;
	},
	
	// validate form
	validateForm: function() {
		console.log("test");
	},
	
	// add new validation
	addValidation: function(field, validation) {
		this.validations.push([field, validation]);
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
		}, options || {});

		// build element
		return ['input', { name: options.name, value: options.value, id: 'f_'+options.name }];
	},
	
	textarea: function(options) {
		// set default options
		options = Object.extend({
			name: "",
			value: "",
			rows: "3"
		}, options || {});
		
		// build element
		return ["textarea", { name: options.name, id: "f_"+options.name, rows: options.rows }, [options.value]];
	},
	
	select: function(options) {
		// set default options
		options = Object.extend({
			name: "",
			value: "",
			values: [],
			valueField: "id",
			titleField: "title",
			multiple: false,
			size: 3
		}, options || {});

		// build element
		var els = [];
		var valuesType = Object.isArray(options.values[0]) ? "array" : (typeof(options.values[0])=="object" ? "json" : "simple");
		for (var i=0, len=options.values.length; i<len; ++i) {
			if (valuesType == "object") {
				values = $H(options.values[i]);
				value = values.get(valueField);
				title = values.get(titleField);
			} else if (valuesType == "array") {
				value = options.values[i][0];
				title = options.values[i][1];
			} else {
				value = title = options.values[i];
			}
			els.push(["option", Object.extend(value==options.value ? { selected: "1" } : {}, { value: value }), [title]]);
		}
		return ["select", Object.extend(options.multiple ? { multiple: "1", size: options.size } : {}, { name: options.name, id: "f_"+options.name }), els];
	},
	
	radio : function(options) {
		// set default options
		options = Object.extend({
			name: "",
			value: "",
			values: [],
			newlines: false
		}, options || {});

		// build element
		var els = [];
		if (!options.values.length) return "no values";
		for (var i=0, len=options.values.length; i<len; ++i) {
			if (Object.isArray(options.values[i])) {
				value = options.values[i][0];
				title = options.values[i][1];
			} else {
				value = title = options.values[i];
			}
			els.push(["li", {}, [["input", Object.extend(value==options.value ? { checked: "1" } : {}, { type: "radio", name: options.name, value: value, id: "f_"+options.name+"_"+value.underscore()})]]]);
			els.push(["li", {}, [["label", { htmlFor: "f_"+options.name+"_"+value.underscore()}, [title]]]]);
		}
		return ["ul", {}, els];
	}
};