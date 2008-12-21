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
			elements: []
		}, options || {});
		this.element.update('').setStyle({ width: this.options.width+'px' });
		this.buildElements(this.options.elements, this.element);

		//Event.observe(window, 'load', SiForm.Tools.setFormSubmiters.bind(this));
		for (var i=0,len=this.forms.length; i<len; i++) {
			Event.observe($(this.forms[i].id), 'submit', this.validateForm.bindAsEventListener(this));
		}

		/*
		// move buttons to the right
		SiForm.Tools.setStyle(".sf-buttons", { paddingLeft: (mw+17)+"px" });
		// set same width to all form elements
		SiForm.Tools.setStyle("#"+this.formId+" input[type='text'], #"+this.formId+" input[type='password'], #"+this.formId+" select[class!='sf-no-fit'], #"+this.formId+" textarea", { width: (this.options.width - mw - 10)+"px" });*/

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
			id: 'sf-form-'+Math.round(Math.random() * 100000)
		}, options || {});

		formTagOpts = {
			action: options.action,
			method: options.method,
			id: options.id
		};

		var el = Builder.node('form', formTagOpts);

		// set validator check
		//Event.observe($(el), 'submit', SiForm.Tools.formValidator.bind(this));
		//$(el).observe('submit', SiForm.Tools.formValidator.bind(this));

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

		var label = Builder.node('label', {
			className: 'sf-label'+(options.customLabelClass ? ' '+options.customLabelClass : ''),
			style: 'width: '+options.labelWidth+'px;'+(options.customLabelStyle ? ' '+options.customLabelStyle : ''),
			htmlFor: 'f_'+options.name
		}, [ Builder.node('span', options.label) ]);
		el.label = label;

		return this.wrapElement([label,el], 'labeled-element');

	},

	buttonsBar: function(options) {
		options = Object.extend({
			label: true,
			elements: []
		}, options || {});
		if (!options.elements) options.elements = [{ type: 'submit', title: 'submit' }];
		if (!Object.isArray(options.elements)) options.elements = [options.elements];

		var bar = Builder.node('div', { className: 'sf-buttons-bar' });
		var buttons = Builder.node('div', { className: 'sf-buttons' });

		for (var i=0, len=options.elements.length; i<len; i++) {
			buttons.appendChild(SiForm.Elements.button(options.elements[i]));
		}

		labelCallback = SiForm.Elements.label.bind(this);
		bar.appendChild(labelCallback(buttons, options));

		return bar;

	},

	button: function(options) {
		options = Object.extend({
			type: 'submit',
			title: 'submit',
			url: '',
			customClass: '',
			customStyle: ''
		}, options || {});

		var btn = Builder.node('button', {
			className: 'sf-button' + (options.customClass ? ' '+options.customClass : ''),
			style: options.customStyle
		}, options.title);

		btn.options = options;

		$(btn).observe('click', SiForm.Tools.buttonCallback);

		return btn;

	},

	textfield: function(options) {
		// set default options
		options = Object.extend({
			name: '',
			value: '',
			isPassword: false,
			customStyle: '',
			customClass: '',
			width: 150
		}, options || {});

		// set properties
		properties = {
			type: options.isPassword ? "password" : "text",
			name: options.name,
			value: options.value,
			id: 'f_'+options.name,
			className:"sf-textfield"+(options.customClass ? " "+options.customClass : ""),
			style: (options.width ? 'width: '+options.width+'px; ' : '')+(options.customStyle ? " "+options.customStyle : "")
		};

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

		var properties = {
			name: options.name,
			id: "f_"+options.name,
			rows: options.rows,
			className:"sf-textfield"+(options.customClass ? " "+options.customClass : ""),
			style: (options.width ? 'width: '+options.width+'px; ' : '')+(options.customStyle ? " "+options.customStyle : "")
		};

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
		node = Builder.node("select", Object.extend(options.multiple ? { multiple: "1", size: options.size } : {}, {
			name: options.name,
			id: "f_"+options.name,
			className: "sf-select"+(options.customClass ? " "+options.customClass : ""),
			style: (options.width ? "width: "+options.width+"px;":"")+(options.customStyle ? " "+options.customStyle : "")
		}));

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
		var el = Builder.node("div", { className: " sf-radios" }), els = [];

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
		var el = Builder.node("div", { className: " sf-checkboxes" });

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
		}, options.title);
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
		passedOptions = Object.extend({ prevElementOptions: Object.clone(options.elementOptions) }, options.elementOptions || {});
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
			passedOptions = Object.extend({ prevElementOptions: Object.clone(options.elementOptions) }, options.elementOptions || {});
			this.buildElements(options.tabs[i].elements, tabcontent, 'tab-element', passedOptions);
			tabsel.tabcontents.push(tabcontent);
			tabsco.appendChild(tabcontent);
		}

		tabsel.setTabs(0);

		tabsel.appendChild(this.wrapElement(tabs, 'tabs'));
		tabsel.appendChild(tabsco);
		return tabsel;

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
	},
	enumerableToOptions: function(enumerabl, selectd, callbeck) {
		var enToOpts_selected = selectd;
		if (!callbeck) callbeck = function(el) { return ["option", Object.extend(enToOpts_selected==el?{ selectd: "1" }:{},{ value: el }), [el.toString()]] };
		return enumerabl.collect(callbeck);
	},
	buttonCallback: function(event) {
		if (this.options.type == 'submit' && this.form) {
			this.form.submit();
		} else if (this.options.type == 'reset' && this.form) {
			this.form.reset();
		} else if (this.options.type == 'url' && this.options.url) {
			location.href = this.options.url;
		}
		Event.stop(event);
	},
	tabsCallback: function(event) {
		var el = event.element();
		if (el.tagName.toLowerCase() == 'span') el = el.up('div');
		el.tabsContainer.setTabs(el.previousSiblings().length);
	},
	setFormSubmiters: function(event) {
		for (var i=0, len=this.forms.length; i<len; i++) {
			console.log(Event.observe($(this.forms[i].id), 'submit', SiForm.Tools.formValidate));
		}
	},
	formValidator: function(event) {
		console.log(this, event);
		alert('xxx');
		Event.stop(event);
	}
};

SiForm.Locale = {
	months: [
		[1,"January"], [2,"February"], [3,'March'], [4,'April'],
		[5,'May'], [6, 'June'], [7,'July'], [8,'August'],
		[9,'September'], [10,'October'], [11,'November'], [12,'December']
	],
};