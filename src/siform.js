/*

SIFORM

Copyright (c) 2008 Dominik Znidar <dominik.znidar@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var SiForm = Class.create({
	validations: [],
	errorTips: {},
	tips: {},
	forms: [],

	/**
	 * Initilizes siform
	 *
	 * @param Element
	 * @param Object siform's options
	 * @return void
	 */
	initialize: function(element, options) {
		this.element = element;
		this.options = Object.extend({
			elements: [],
			columnsSpacing: 6,
			additionalElementPadding: 4
		}, options || {});
		this.element.update('').setStyle({ width: this.options.width+'px' });
		this.buildElements(this.options.elements, this.element);

		// create tooltip
		$$('body')[0].insert(Builder.node('div', { className: 'sf-tooltip', id: 'sf-tooltip', style: 'display:none;' }));
	},

	/**
	 * Generates elements
	 *
	 * @param Array elements
	 * @param DomElement wrapper
	 * @return void
	 */
	buildElements: function(elements, wrapper, doWrapWith, additOptions) {
		additOptions = additOptions || {};
		for (var i=0, len=elements.length; i<len; ++i) {
			var elOpts = Object.extend(Object.clone(additOptions)||{},elements[i]);
			if (elOpts.prevElementOptions) {
				elOpts.elementOptions = Object.extend(elOpts.prevElementOptions, elOpts.elementOptions || {});
			}
			if (!elOpts.type || !SiForm.Elements[elOpts.type]) continue;
			elMethod = SiForm.Elements[elOpts.type].bind(this);
			if (!elMethod) continue;

			var el = elMethod(elOpts);
			if (!el) continue;
			el.sfOptions = elOpts;

			if (elOpts.validations) {
				this.validations.push(elOpts);
			}

			labelCallback = SiForm.Elements.label.bind(this);
			el = labelCallback(el, elOpts);
			wrapper.appendChild(this.wrapElement(el, doWrapWith));

		}
	},

	/**
	 * Adds a wrapping div to element(s)
	 *
	 * @param DomElement|Array
	 * @param string className
	 * @return DomElement
	 */
	wrapElement: function(el, className) {
		if (!className) return el;
		return Builder.node('div', { className: 'sf-' + className }, [
			el,
			Builder.node('div', { className: 'sf-cf' })
		]);
	},

	validateForm: function(e) {
		alert('test');
		//return false;
		Event.stop(e);
	}

});

SiForm.Elements = {

	html: function(options) {
		options = Object.extend({
			value: "",
			customClass: '',
			customStyle: ''
		}, options || {});

		var div = Builder.node('div', {
			className: 'sf-html'+(options.customClass ? ' '+options.customClass : ''),
			style: options.style
		});
		$(div).update(options.value);

		return div;
	},

	form: function(options) {
		options = Object.extend({
			action: '#',
			method: 'post',
			update: '',
			elementOptions: {},
			elements: [],
			buttons: [],
			id: 'sf-form-'+Math.round(Math.random() * 100000),
			ajax: false,
			ajaxOptions: null,
			update: ''
		}, options || {});

		formTagOpts = SiForm.Tools.setClassAndStyle(options, {
			action: options.action,
			method: options.method,
			id: options.id
		}, 'sf-form');

		var el = Builder.node('form', formTagOpts);
		el.formOptions = options;

		// set validator check
		Event.observe($(el), 'submit', SiForm.Tools.formValidator.bindAsEventListener(this, el));

		// build elements
		passedOptions = Object.extend({ prevElementOptions: Object.clone(options.elementOptions) }, options.elementOptions || {});
		this.buildElements(options.elements, el, 'form-element', passedOptions);

		// build buttons
		if (options.buttons) {
			clbck = SiForm.Elements.buttonsBar.bind(this);
			el.appendChild(clbck(Object.extend(options.buttons, options.elementOptions)));
		}

		this.forms.push(el);

		return el;

	},

	label: function(el, options) {
		options = Object.extend({
			label: false,
			labelWidth: 100,
			customLabelStyle: '',
			customLabelClass: ''
		}, options || {});
		if (!options.label) return el;

		forEl = el.identify();
		var label = Builder.node('label', {
			className: 'sf-label'+(options.customLabelClass ? ' '+options.customLabelClass : ''),
			style: 'width: '+options.labelWidth+'px;'+(options.customLabelStyle ? ' '+options.customLabelStyle : ''),
			htmlFor: forEl
		}, [ Builder.node('span', options.label) ]);
		el.label = label;

		return this.wrapElement([label,el], 'labeled-element');

	},

	buttonsBar: function(options) {
		options = Object.extend({
			label: true,
			elements: []
		}, options || {});
		if (!Object.isArray(options.elements)) options.elements = [];
		if (options.elements.length == 0) options.elements = [{ type: 'button', buttonType: 'submit', title: 'Save' }];

		var bar = Builder.node('div', { className: 'sf-buttons-bar' });
		var buttons = Builder.node('div', { className: 'sf-buttons' });

		this.buildElements(options.elements, buttons);

		labelCallback = SiForm.Elements.label.bind(this);
		bar.appendChild(labelCallback(buttons, options));

		return bar;

	},

	button: function(options) {
		options = Object.extend({
			type: 'submit',
			title: 'submit',
			url: ''
		}, options || {});

		var btn = Builder.node('button', SiForm.Tools.setClassAndStyle(options, {}, 'sf-button'), options.title);

		$(btn).observe('click', SiForm.Tools.buttonCallback);

		return btn;

	},

	textfield: function(options) {
		// set default options
		options = Object.extend({
			name: '',
			value: '',
			isPassword: false,
			width: 150
		}, options || {});

		// set properties
		properties = SiForm.Tools.setClassAndStyle(options, {
			type: options.isPassword ? "password" : "text",
			name: options.name,
			value: options.value,
			id: 'f_'+options.name
		}, 'sf-textfield');

		// build element
		return Builder.node('input', properties);
	},

	textarea: function(options) {
		// set default options
		options = Object.extend({
			name: "",
			value: "",
			rows: 3,
			customStyle: '',
			customClass: '',
			width: 150
		}, options || {});

		var properties = SiForm.Tools.setClassAndStyle(options, {
			name: options.name,
			id: "f_"+options.name,
			rows: options.rows
		}, 'sf-textarea');

		return Builder.node("textarea", properties, options.value);
	},

	select: function(options) {
		//return Builder.node('div', 'select not implemented yet');
		// set default options
		options = Object.extend({
			name: "",
			value: "",
			values: [],
			valueField: "id",
			titleField: "title",
			multiple: false,
			size: 3,
			customStyle: '',
			customClass: '',
			width: 150
		}, options || {});

		// build element
		node = Builder.node("select", SiForm.Tools.setClassAndStyle(
			options,
			Object.extend(options.multiple ? { multiple: "1", size: options.size } : {}, {
				name: options.name,
				id: "f_"+options.name
			}),
		'sf-select'));

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
				value = options.values[i];
				title = options.values[i];
			}
			node.appendChild(Builder.node("option", { value: value }, title));
		}

		for (var i=0, len=node.options.length; i<len; i++) {
			if (node.options[i].value == options.value) node.options[i].selected = true;
		}

		return node;

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
		var el = Builder.node("div", SiForm.Tools.setClassAndStyle(
			options,
			{ id: 'f_'+options.name },
			'sf-radios'
		)), els = [];

		if (!options.values.length) return "no values";
		for (var i=0, len=options.values.length; i<len; ++i) {
			if (Object.isArray(options.values[i])) {
				value = options.values[i][0];
				title = options.values[i][1];
			} else {
				value = title = options.values[i];
			}
			el.appendChild(this.wrapElement([
				Builder.node("input", Object.extend(value==options.value ? { checked: "1" } : {}, { type: "radio", name: options.name, value: value, id: "f_"+options.name+"_"+value.underscore(), className: "sf-radio"})),
				Builder.node("label", { htmlFor: "f_"+options.name+"_"+value.underscore(), className: "sf-sub-label"}, title)
			], 'sub-element'));

		}

		return el;
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
		var el = Builder.node("div", SiForm.Tools.setClassAndStyle(
			options,
			{ id: 'f_'+options.name },
			'sf-checkboxes'
		));

		if (!options.values.length) return "no values";
		if (!Object.isArray(options.value)) options.value = [options.value];
		for (var i=0, len=options.values.length; i<len; ++i) {
			if (Object.isArray(options.values[i])) {
				value = options.values[i][0];
				title = options.values[i][1];
			} else {
				value = title = options.values[i];
			}
			el.appendChild(this.wrapElement([
				Builder.node("input", Object.extend(options.value.indexOf(value)>-1 ? { checked: "1" } : {}, { type: "checkbox", name: options.name, value: value, id: "f_"+options.name+"_"+value.underscore(), className: "sf-checkbox"})),
				Builder.node("label", { htmlFor: "f_"+options.name+"_"+value.underscore(), className:"sf-sub-label"}, title)
			], 'sub-element'));
		}

		return el;
	},

	dateselect: function(options) {
		//return Builder.node('div', 'dateselect not implemented yet');
		var d = new Date();
		options = Object.extend({
			name: "",
			value: d.getFullYear()+'-'+"0".concat(d.getMonth()+1).slice(-2)+"-"+"0".concat(d.getDate()).slice(-2),
			monthDisplay: "string",
			startYear: d.getFullYear()-100,
			endYear: d.getFullYear(),
			includeTime: false
		}, options || {});

		valArr = options.value.split("-");
		valueContainer = SiForm.Elements.hidden({ name: options.name, value: options.value });
		valueCallback = function() {
			vcName = this.valueContainer.name;
			dsElement = $('ds_'+vcName);
			dp = dsElement.dateparts;
			this.valueContainer.value = dp.year.options[dp.year.selectedIndex].value + "-" +
			                            "0".concat(dp.month.options[dp.month.selectedIndex].value).slice(-2) + "-" +
			                            "0".concat(dp.day.options[dp.day.selectedIndex].value).slice(-2);
		};

		var ds = Builder.node("div", { className: "sf-dateselect", id: 'ds_'+options.name });
		ds.dateparts = { day: false, month: false, year: false, time: false };

		var days = SiForm.Elements.select({ name: options.name+"_day", values: $A($R(1,31)), value: valArr[2], width: false });
		days.valueContainer = valueContainer;
		days.onchange = valueCallback;
		ds.appendChild(days);
		ds.dateparts.day = days;

		var months = SiForm.Elements.select({ name: options.name+"_month", values: SiForm.Locale.months, value: parseFloat(valArr[1]), width: false });
		months.valueContainer = valueContainer;
		months.onchange = valueCallback;
		ds.appendChild(months);
		ds.dateparts.month = months;

		var years = SiForm.Elements.select({ name: options.name+"_year", values: $A($R(options.startYear,options.endYear)), value: valArr[0], width: false });
		years.valueContainer = valueContainer;
		years.onchange = valueCallback;
		ds.appendChild(years);
		ds.dateparts.year = years;

		ds.appendChild(valueContainer);

		return ds;
	},

	group: function(options) {
		options = Object.extend({
			title: '',
			collapsible: false,
			collapsed: false,
			customClass: '',
			customStyle: '',
			width: 272,
			elementOptions: {},
			elements: []
		}, options || {});

		var fs = Builder.node("fieldset", {
			className: 'sf-group' + (options.customClass ? " "+options.customClass : "")
		});
		var legend = Builder.node('legend', {
			className: 'sf-group-title' + (options.customTitleClass ? " "+options.customTitleClass : "")
		}, [Builder.node('span', options.title)]);
		var fsContent = Builder.node('div', { className: 'sf-group-content' });

		if (options.collapsible) {
			$(fs).addClassName('sf-group-collapsible');
			if (options.collapsed) $(fs).addClassName('sf-group-collapsed');
			$(legend).observe('click', function(event) {
				var el = event.element();
				el.up('fieldset').toggleClassName('sf-group-collapsed');
			});
		}

		fs.appendChild(legend);
		passedOptions = Object.extend({ prevElementOptions: Object.clone(options.elementOptions), groupNode: fs }, options.elementOptions || {});
		this.buildElements(options.elements, fsContent, 'group-element', passedOptions);
		fs.appendChild(fsContent);

		return fs;

	},

	tabs: function(options) {
		options = Object.extend({
			elementOptions: [],
			tabs: [],
			id: 'sf-tabs-'+Math.round(Math.random() * 10000)
		}, options || {});
		if (options.tabs.length == 0) return;

		var tabsel = Builder.node('div', { className: 'sf-tabs-container', id: options.id }),
		    tabs = [],
		    tabsco = Builder.node('div', { className: 'sf-tabs-contents' });
		tabsel.tabtitles = [];
		tabsel.tabcontents = [];

		tabsel.setTabs = function(selInd) {
			this.tabtitles.invoke('removeClassName', 'sf-tab-active');
			this.tabcontents.invoke('hide');
			this.tabtitles[selInd].addClassName('sf-tab-active');
			this.tabcontents[selInd].show();
		}

		// create tabs
		for (var i=0,len=options.tabs.length; i<len; i++) {
			var tab = Builder.node('div', { className: 'sf-tab' }, [ Builder.node('span', options.tabs[i].title) ]);
			tab.tabsContainer = tabsel;
			$(tab).observe('click', SiForm.Tools.tabsCallback);
			if (i==0) tab.addClassName('sf-tab-active');
			tabsel.tabtitles.push(tab);
			tabs.push(tab);
		}

		// create tab contents
		for (var i=0,len=options.tabs.length; i<len; i++) {
			var tabcontent = Builder.node('div', { className: 'sf-tab-content' });
			passedOptions = Object.extend({ prevElementOptions: Object.clone(options.elementOptions), tabTitle: tabsel.tabtitles[i] }, options.elementOptions || {});
			this.buildElements(options.tabs[i].elements, tabcontent, 'tab-element', Object.extend(passedOptions));
			tabsel.tabcontents.push(tabcontent);
			tabsco.appendChild(tabcontent);
		}

		tabsel.setTabs(0);

		tabsel.appendChild(this.wrapElement(tabs, 'tabs'));
		tabsel.appendChild(tabsco);
		return tabsel;

	},

	columns: function(options) {
		options = Object.extend({
			elementOptions: {},
			elements: [],
			customClass: '',
			customStyle: '',
			width: 150,
			name: 'sf-columns-'+Math.round(Math.random() * 10000),
			id: 'sf-tabs-'+Math.round(Math.random() * 10000)
		}, options || {});

		var el = Builder.node('div', {
			className: 'sf-columns' + (options.customClassName ? ' '+options.customClassName : ''),
			style: "width: "+ (options.width + (this.options.additionalElementPadding*2))+ "px;" + (options.customStyle ? " "+options.customStyle : "")
		}), elLen = options.columns || options.elements.length, elPad = this.options.additionalElementPadding, coSpa = this.options.columnsSpacing;
		cId = el.identify();

		passedOptions = Object.extend({ prevElementOptions: Object.clone(options.elementOptions) }, options.elementOptions || {});
		paCount = (elLen - 1) * 2;
		spCount = elLen - 1;
		colWidth = Math.floor((options.width - paCount * elPad - spCount * coSpa) / elLen);
		for (var i=0,len = options.elements.length; i<len; i++) {
			po = Object.clone(passedOptions);
			elCols = options.elements[i].columns || 1;
			if (elCols==1) {
				po.width = colWidth;
			} else {
				po.width = colWidth * elCols + (elCols-1)*coSpa + (elCols-1) * 2 * elPad;
			}
			if (i < len-1) po.customStyle = 'margin-right: '+coSpa+'px;'
			po.labelFromId = cId;
			this.buildElements([options.elements[i]], el, 'column-element', po);
		}

		return el;

	},

	hidden: function(options) {
		options = Object.extend({
			value: '',
			name: ''
		}, options || {});

		return Builder.node('input', { type: 'hidden', value: options.value, name: options.name, id: 'f_'+options.name });

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
			var field1 = $("f_"+valParams[0]).value, field2 = $("f_"+valCommand['name']).value;
			return field1 == field2;
		},
		message: "Values don't match!"
	}
}

SiForm.Tools = {
	setClassAndStyle: function(elOpts, bOpts, classNames, styles) {
		elOpts = Object.extend({ customClass: [], customStyle: [], width: '' }, elOpts || {});
		if (Object.isString(elOpts.customClass)) elOpts.customClass = [elOpts.customClass];
		if (Object.isString(elOpts.customStyle)) elOpts.customStyle = [elOpts.customStyle];
		if (classNames) elOpts.customClass.push(classNames);
		if (styles) elOpts.customStyle.push(styles);
		if (elOpts.width) elOpts.customStyle.push('width: '+elOpts.width+'px;');

		return Object.extend(bOpts, {
			className: elOpts.customClass.join(' '),
			style: elOpts.customStyle.join(' ')
		});
	},
	buttonCallback: function(event) {
		if (this.sfOptions.buttonType == 'reset' && this.form) {
			event.stop();
			this.form.reset();
		} else if (this.sfOptions.buttonType == 'url' && this.sfOptions.url) {
			event.stop();
			location.href = this.options.url;
		}
		return false;
	},
	tabsCallback: function(event) {
		var el = event.element();
		if (el.tagName.toLowerCase() == 'span') el = el.up('div');
		el.tabsContainer.setTabs(el.previousSiblings().length);
	},
	formValidator: function(event, formO) {
		var values = formO.serialize(true), fEls = formO.getElements(), foundErrors = false;
		for (var i=0, len=this.validations.length; i<len; i++) {
			var opts = this.validations[i], elValidations = opts.validations;
			if (!Object.isArray(elValidations)) elValidations = [elValidations];

			for (var j=0, lenj=elValidations.length; j<lenj; j++) {

				valArr = elValidations[j].split("-");
				validation = valArr.shift();
				valParams = valArr;
				if (vOpts = SiForm.Validations[validation]) {
					// validate
					if (vOpts.callback) {
						passed = vOpts.callback(this, values, valParams, opts);
					} else {
						re = new RegExp(vOpts.pattern);
						passed = re.test(values[opts.name] || "");
					}

					if (!passed) {
						foundErrors = true;
						if (el = $('f_'+opts.name)) el.addError(elValidations[j], vOpts.message);
					} else {
						if (el = $('f_'+opts.name)) el.removeError(elValidations[j]);
					}
				}

			}

		}

		if (foundErrors) {
			event.stop();
		} else if (formO.sfOptions.ajax) {
			opts = formO.sfOptions;
			opts.ajaxOptions.parameters = values;
			opts.ajaxOptions.method = opts.method || 'post';

			if (opts.update) {
				new Ajax.Updater(opts.update, opts.action, opts.ajaxOptions);
			} else {
				new Ajax.Request(opts.action, opts.ajaxOptions);
			}

			event.stop();
		}
	},

	showTooltip: function(e) {
		var el = e.element();
		tagName = el.tagName.toLowerCase();
		if (['label','input','textarea'].include(tagName) && el.hasErrors()) {
			el = e.element();
			el.showTooltip(e);
		} else if (tagName == 'span' && el.up().hasErrors() && !el.up().hasClassName('sf-tab')) {
			el.up().showTooltip(e);
		}
		e.stop();
		return false;
	},

	hideTooltip: function(e) {
		$('sf-tooltip').hide();
		e.stop();
	}

};

SiForm.Locale = {
	months: [
		[1,"January"], [2,"February"], [3,'March'], [4,'April'],
		[5,'May'], [6, 'June'], [7,'July'], [8,'August'],
		[9,'September'], [10,'October'], [11,'November'], [12,'December']
	]
};

SiForm.ExtendElement = {
	addError: function(element, error, message) {
		element = $(element);
		if (error.indexOf('||')==-1) error += "||" + element.identify();
		hadErrors = element.hasErrors();
		if (!element.errors) element.errors = {};
		if (!element.errors[error]) element.errors[error] = message;
		if (!hadErrors) {
			element.addClassName('sf-val-error');
			if (element.sfOptions) {
				if (label = element.label) label.addError(error, message);
				else if (element.sfOptions.labelFromId) {
					if (pel = $(element.sfOptions.labelFromId)) pel.label.addError(error, message);
				}
				if (gn = element.sfOptions.groupNode) $(gn).addError(error,message);
				if (tab = element.sfOptions.tabTitle) tab.addError(error,message);
			}
			if (!element.bindedShowTooltip) {
				element.bindedShowTooltip  = SiForm.Tools.showTooltip.bind(element);
				element.observe('mouseover', element.bindedShowTooltip);
				element.observe('mouseout', SiForm.Tools.hideTooltip);
			}
		}
	},
	removeError: function(element, error) {
		element = $(element);
		if (error.indexOf('||')==-1) error += "||" + element.identify();
		if (!element.errors) return;
		if (!element.hasErrors()) return;
		if (element.errors[error]) delete element.errors[error];
		if (!element.hasErrors()) {
			element.removeClassName('sf-val-error');
			if (element.sfOptions) {
				if (label = element.label) label.removeError(error);
				else if (element.sfOptions.labelFromId) {
					if (pel = $(element.sfOptions.labelFromId)) pel.label.removeError(error);
				}
				if (gn = element.sfOptions.groupNode) gn.removeError(error);
				if (tab = element.sfOptions.tabTitle) tab.removeError(error);
			}
			element.stopObserving('mouseover', element.bindedShowTooltip);
			element.stopObserving('mouseout', SiForm.Tools.hideTooltip);
			delete element.bindedShowTooltip;
		}
	},
	hasErrors: function(element) {
		element = $(element);
		if (!element.errors) return false;
		return Object.keys(element.errors).join("") != "";
	},
	showTooltip: function(element, event) {
		element = $(element);
		if (element.hasErrors()) {
			tt = $('sf-tooltip').show();
			tt.clonePosition(element, { setWidth: false, setHeight: false, offsetTop: element.getHeight() + 3 });
			tt.update(Object.values(element.errors).join("<br/>"));
		}
	}
}

Element.addMethods(SiForm.ExtendElement);
