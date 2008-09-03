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
		this.formId = this.options.formOptions.id;
		this.element.update(this.buildForm());
		if (this.options.displayType == "list") {
			mw = SiForm.Tools.fixWidth(".sf-label", 5);
			SiForm.Tools.setStyle(".sf-input-div, .sf-buttons", { paddingLeft: mw+"px" });
			SiForm.Tools.setStyle("#"+this.formId+" input[type='text'], #"+this.formId+" input[type='password'], #"+this.formId+" select, #"+this.formId+" textarea", { width: (this.options.width - mw - 10)+"px" });
		}
		Event.observe(this.options.formOptions.id, 'submit', this.validateForm.bindAsEventListener(this));
	},

	// build form
	buildForm: function() {
		var formElements = this.getFormElements(this.options.elements);
		var formButtons = this.getFormButtons();
		if (this.options.displayType == 'table') {
			wrapper = ["table", { cellpadding: 0, cellspacing: 0, className: "sf-table" }, [
				["tbody", {}, [].concat(formElements, formButtons) ]
			]];
		} else {
			wrapper = ["div", { className: "sf-form-content" }, [].concat(formElements, formButtons)];
		}
		return this.createElement("form", { 
			action: this.options.formOptions.action,
			method: this.options.formOptions.method,
			id: this.options.formOptions.id,
			className: "sf-form"
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
		return [["div", { className: 'sf-buttons' }, [["input", { type: "submit" }]]]];
	},

	labelElement: function(element, elementOptions) {
		label = ["label", { htmlFor: "f_"+elementOptions.name, className: "sf-label" }, [elementOptions.title]];
		if (this.options.displayType == "table") {
			return ["tr", {}, [
				["td", { className: "sf-label-cell" }, [label]],
				["td", { className: "sf-element-cell" }, [element]]
			]];
		} else {
			return ["div", { className: "sf-form-element" }, [label, ["div", { className: "sf-input-div" }, [element]]]];
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
	validateForm: function(e) {
		var values = $(this.options.formOptions.id).serialize(true), foundError = false;
		if (this.validations.length == 0) return true;
		for (var i=0,len=this.validations.length; i<len; ++i) {
			valArr = this.validations[i][1].split("-");
			validation = valArr.shift();
			valParams = valArr;
			if (opts = SiForm.Validations[validation]) {
				// validate
				if (opts.callback) {
					passed = opts.callback(this, values, valParams, this.validations[i]);
				} else {
					re = new RegExp(opts.pattern);
					passed = re.test(values[this.validations[i][0]]);
				}
				// do stuff
				if (!passed) {
					$("f_"+this.validations[i][0]).addClassName("sf-val-error");
					foundErrors = true
				} else {
					$("f_"+this.validations[i][0]).removeClassName("sf-val-error");
				}
			}
		}
		if (foundErrors) Event.stop(e);
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
			isPassword: false
		}, options || {});

		// set properties
		properties = {
			type: options.isPassword ? "password" : "text",
			name: options.name,
			value: options.value,
			id: 'f_'+options.name,
			className:"sf-textfield"
		};

		// build element
		return ['input', properties];
	},
	
	textarea: function(options) {
		// set default options
		options = Object.extend({
			name: "",
			value: "",
			rows: "3"
		}, options || {});
		
		// build element
		return ["textarea", { name: options.name, id: "f_"+options.name, rows: options.rows, className:"sf-textarea" }, [options.value]];
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
		return ["select", Object.extend(options.multiple ? { multiple: "1", size: options.size } : {}, { name: options.name, id: "f_"+options.name, className: "sf-select" }), els];
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
			label = ["input", Object.extend(value==options.value ? { checked: "1" } : {}, { type: "radio", name: options.name, value: value, id: "f_"+options.name+"_"+value.underscore(), className: "sf-radio"})];
			radioel = ["label", { htmlFor: "f_"+options.name+"_"+value.underscore(), className: "sf-sub-label"}, [title]];
			els.push(["div", { className: "sf-sub-element" }, [label, radioel]]);
		}
		return ["div", { className: " sf-radios" }, els];
	},
	
	checkbox : function(options) {
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
		if (!Object.isArray(options.value)) options.value = [options.value]; 
		for (var i=0, len=options.values.length; i<len; ++i) {
			if (Object.isArray(options.values[i])) {
				value = options.values[i][0];
				title = options.values[i][1];
			} else {
				value = title = options.values[i];
			}
			label = ["input", Object.extend(options.value.indexOf(value)>-1 ? { checked: "1" } : {}, { type: "checkbox", name: options.name, value: value, id: "f_"+options.name+"_"+value.underscore(), className: "sf-checkbox"})];
			checkel = ["label", { htmlFor: "f_"+options.name+"_"+value.underscore(), className:"sf-sub-label"}, [title]];
			els.push(["div", { className: "sf-sub-element" }, [label, checkel]]);
		}
		return ["div", { className: " sf-checkboxes" }, els];
	}
};

SiForm.Validations = {
	required: {
		pattern: /(.+)/,
		message: "This field is required!"
	},
	email: {
		pattern: /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/,
		message: "This in not a valid e-mail address!"
	},
	sameAs: {
		callback: function(sfObj, values, valParams, valCommand) {
			var field1 = $("f_"+valParams[0]).value, field2 = $("f_"+valCommand[0]).value;
			return field1 == field2;
		},
		message: "Values don't match!"
	}
}

SiForm.Tools = {
	fixWidth: function(selector, margin) {
		var maxWidth = 0;
		$$(selector).each(function(el) { width = el.getWidth(); maxWidth = width > maxWidth ? width : maxWidth; });
		if (margin) maxWidth += margin;
		$$(selector).each(function(el) { el.style.width = maxWidth+"px"; });
		return maxWidth;
	},
	setStyle: function(selector,styles) {
		var setStyleStyles = styles;
		$$(selector).each(function(el) { el.setStyle(setStyleStyles); });
	}
};