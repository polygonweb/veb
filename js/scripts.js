

/**
 * Утилиты
 */
;(function(global) {
	'use strict';

	var utils = {};


	/**
	 * Функция для вычисления размера скроллбара
	 */
	utils.getScrollBarValue = function() {
		var el = document.createElement('div'),
			value;

		el.style.overflow = 'scroll';
		el.style.position = 'fixed';
		el.style.width = '99px';
		el.style.height = '99px';
		el.style.padding = '0';
		el.style.border = '0';

		document.body.appendChild(el);
		value = el.offsetWidth - el.clientWidth;
		document.body.removeChild(el);

		return value;
	};


	/**
	 * Функция для задержки выполнения
	 */
	utils.debounce = function(fn, delay) {
		var timeout = null;
		return function () {
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				fn(arguments);
			}, delay);
		}
	};


	/**
	 * Полифилл для bind
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	 */
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if (typeof this !== 'function') {
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}

			var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function() {},
			fBound = function() {
				return fToBind.apply(this instanceof fNOP
					? this
					: oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};

			if (this.prototype) {
				// Function.prototype doesn't have a prototype property
				fNOP.prototype = this.prototype;
			}
			fBound.prototype = new fNOP();

			return fBound;
		};
	}


	/**
	 * Функция для задания стилей в теге style
	 */
	utils.setStyle = function(styleElement, text) {
		if (styleElement.styleSheet) { // IE8-
			styleElement.styleSheet.cssText = text;
		} else {
			styleElement.textContent = text;
		}
	};


	/**
	 * Полифилл для textContent
	 */
	if (Object.defineProperty
		&& Object.getOwnPropertyDescriptor
		&& Object.getOwnPropertyDescriptor(Element.prototype, "textContent")
		&& !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get) {
		(function() {
			var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
			Object.defineProperty(Element.prototype, "textContent",
			{
				get: function() {
					return innerText.get.call(this);
				},
				set: function(s) {
					return innerText.set.call(this, s);
				}
			}
			);
		})();
	}


	global.utils = utils;
})(window);




/**
 * Форма поиска в шапке
 */
;(function(global, $) {
	'use strict';

	function SearchForm(options) {
		this.element = options.element;
		this.triggerButton = options.triggerButton;

		if(options.isOpen !== undefined) {
			self.isOpen = options.isOpen
		} else {
			self.isOpen = false;
		};

		this.init();
	}


	SearchForm.prototype.init = function() {
		this.bindEvents();
		(this.isOpen) ? (this.open()) : (this.close());
	};


	SearchForm.prototype.open = function() {
		$(this.element).addClass('search-form_show');
		this.isOpen = true;
	};


	SearchForm.prototype.close = function() {
		$(this.element).removeClass('search-form_show');
		this.isOpen = false;
	};


	SearchForm.prototype.toggle = function() {
		(this.isOpen) ? (this.close()) : (this.open());
	};


	SearchForm.prototype.bindEvents = function() {
		var self = this;

		$(self.triggerButton).on('click', function(e) {
			e.preventDefault();
			self.open();
		});

		$(document).on('click', function(e) {
			var target = e.target;

			if ( !self.element.contains(target) && !self.triggerButton.contains(target) ) {
				self.close();
			};
		});
	};


	global.SearchForm = SearchForm;
})(window, jQuery);




/**
 * Форма поиска в фильтре
 */
;(function(global, $) {
	'use strict';


	var $elem,
		$trigger,
		isOpen,
		exports;


	var closeHandler = function(e) {
		var target = e.target;

		if (!$elem.get(0).contains(target) &&
			$(target).closest('#filterBlock').length === 0) {
			close();
		}
	};


	var init = function init(options) {
		if (!options.element) {
			return false;
		};

		$elem = $(options.element);
		$trigger = $(options.trigger);
		isOpen = false;
		$trigger.on('click', toggle);
	};


	var open = function open() {
		$elem.addClass('filter-search_show');
		isOpen = true;
		$(document).on('click', closeHandler);
	};


	var close = function close() {
		$elem.removeClass('filter-search_show');
		isOpen = false;
		$(document).off('click', closeHandler);
	};


	var toggle = function toggle() {
		(isOpen) ? (close()) : (open());
	};


	exports = {
		init: init,
		open: open,
		close: close
	};


	window.filterSearchForm = exports;
})(window, jQuery);




/**
 * Таблицы с данными
 */
;(function(global, $) {
	'use strict';

	// импортируем функции из модуля utils
	var getScrollBarValue = global.utils.getScrollBarValue;
	var debounce = global.utils.debounce;
	var setStyle = global.utils.setStyle;


	function DataGrid(options) {
		this.element = options.element;
		this.id = this.element.id;
		this.gutterCellIndex = options.gutterCellIndex;
		this.cellGutter = options.cellGutter;
		this.body = this.element.querySelector('.datagrid__main');
		this.scrolls = this.element.querySelectorAll('.datagrid__scroll');
		this.headTable = this.element.querySelector('.datagrid__head .datagrid__row');
		this.init();
	}


	DataGrid.prototype.init = function() {
		var self = this,
			style,
			styleContent;

		self.bindEvents();

		/* делаем дополнительный отступ на величину скроллбара,
		чтобы колонки выстраивались друг под другом */
		style =  document.createElement('style');
		style.setAttribute('type', 'text/css'); // IE8-
		styleContent = '' +
			'.datagrid__head {' +
				'padding-right: ' + getScrollBarValue() + 'px;' +
			'}';
		setStyle(style, styleContent);
		document.getElementsByTagName('head')[0].appendChild(style);

		/* задаем одинаковыую ширину всем таблицам в гриде */
		self.tableWidthStyle = document.createElement('style');
		self.tableWidthStyle.setAttribute('type', 'text/css'); // IE8-
		document.getElementsByTagName('head')[0].appendChild(self.tableWidthStyle);

		self.setSize();
		self.setHierarchical(self.body, 0);
	};


	DataGrid.prototype.setSize = function() {
		var self = this,
			width,
			styleContent;

		setStyle(self.tableWidthStyle, '');
		width = self.headTable.clientWidth;
		styleContent = '' +
			'#' + self.id + ' .datagrid__row {' +
				'width: ' + width + 'px' +
			'}';
		setStyle(self.tableWidthStyle, styleContent);;
	};


	DataGrid.prototype.bindEvents = function() {
		var self = this;

		$(self.body).on('click', '.datagrid__toggle', function(e) {
			var btn = e.target,
				item = $(btn).closest('.datagrid-collapse').get(0);

			if ($(item).hasClass('datagrid-collapse_animating')) return;
			self.toggleItem(item);
		});

		if(self.body) {
			self.body.onscroll = function() {
				var scrollX = this.scrollLeft,
					len = self.scrolls.length;

				while(len--) {
					self.scrolls[len].scrollLeft = scrollX;
				}
			};
		};

		$(window).on('resize', debounce(self.setSize.bind(self), 300));
	};


	DataGrid.prototype.openItem = function(item) {
		var content = item.querySelector('.datagrid-collapse__out');
		content.style.height = content.scrollHeight + 'px';
		$(item).addClass('datagrid-collapse_open');
		content.clientHeight;
		if (Modernizr.csstransitions) {
			$(item).addClass('datagrid-collapse_animating');
			$(content).one('transitionend webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd', function(e) {
				content.style.height = 'auto';
				$(item).removeClass('datagrid-collapse_animating');
			});
		} else {
			content.style.height = 'auto';
		};
	};


	DataGrid.prototype.closeItem = function(item) {
		var content = item.querySelector('.datagrid-collapse__out');
		content.style.height = content.scrollHeight + 'px';
		content.clientHeight;
		content.style.height = '';
		if (Modernizr.csstransitions) {
			$(item).addClass('datagrid-collapse_animating');
			$(content).one('transitionend webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd', function(e) {
				$(item).removeClass('datagrid-collapse_animating');
			});
		}
		$(item).removeClass('datagrid-collapse_open');
	};


	DataGrid.prototype.isOpen = function(item) {
		return $(item).hasClass('datagrid-collapse_open');
	};


	DataGrid.prototype.toggleItem = function(item) {
		var self = this;
		self.isOpen(item) ? (self.closeItem(item)) : (self.openItem(item));
	};


	DataGrid.prototype.setHierarchical = function(item, level) {
		var self = this,
			cellIndex = self.gutterCellIndex,
			cellGutter = self.cellGutter,
			base,
			grids,
			grid,
			rows,
			row,
			cell,
			childItem;


		grids = item.children;
		for(var i = 0, len = grids.length; i < len; i++) {
			grid = grids[i];
			row = grid.querySelector('.datagrid__row');
			if (!row) continue;
			cell = row.querySelectorAll('.datagrid__cell')[cellIndex];
			base = parseFloat(window.getComputedStyle ? window.getComputedStyle(cell).paddingLeft : cell.currentStyle.paddingLeft);
			cell.style.paddingLeft = base + cellGutter*level + 'px';
			childItem = grid.querySelector('.datagrid-collapse__out > .datagrid-collapse__in');

			if (childItem) {
				self.setHierarchical(childItem, level + 1);
			};
		};
	};



	global.DataGrid = DataGrid;
})(window, jQuery);




/**
 * Выпадающие блоки
 */
;(function(global, $) {
	'use strict';

	function DropBlock(options) {
		if (!options.element) {
			return false;
		};

		var self = this;

		self.element = options.element;
		self.trigger = options.trigger || self.element.querySelector('.drop__trigger');
		self.dropElement = options.dropElement || self.element.querySelector('.drop__content');

		self.onOpen = options.onOpen || null;
		self.onClose = options.onClose || null;

		self.onClick = self.onClick.bind(self);
		$(self.trigger).on('click', function(e) {
			e.preventDefault();
			self.toggle();
		});

		if(options.isOpen !== undefined) {
			self.isOpen = options.isOpen
		} else {
			self.isOpen = false;
		};

		self.isOpen ? self.open() : self.close();
	}


	DropBlock.prototype.onClick = function (event) {
		var self = this,
			$target = $(event.target);

		if ($target.closest('.ui-corner-all').length > 0 ||
			$target.closest('.select2-container').length > 0
			) {
			return false;
		};


		if (!self.element.contains(event.target)) {
			self.close();
		};
	};


	DropBlock.prototype.open = function () {
		var self = this;

		$(self.element).addClass('drop_open');
		self.isOpen = true;

		if (typeof self.onOpen === 'function') {
			self.onOpen(self.element, self.trigger, self.dropElement);
		};

		$(document).on('click', self.onClick);
	};


	DropBlock.prototype.close = function () {
		var self = this;

		$(self.element).removeClass('drop_open');
		self.isOpen = false;

		if (typeof self.onClose === 'function') {
			self.onClose(self.element, self.trigger, self.dropElement);
		};

		$(document).off('click', self.onClick);
	};


	DropBlock.prototype.toggle = function () {
		(this.isOpen) ? (this.close()) : (this.open());
	};


	DropBlock.prototype.isOpen = function () {};


	global.DropBlock = DropBlock;
})(window, jQuery);




/**
 * События при загрузке DOM
 */
$(function() {

	// инициализация формы поиска в шапке
	var search = new SearchForm({
		element: document.getElementById('searchFormId'),
		triggerButton: document.getElementById('searchTriggerId')
	});


	// форма поиска в фильтре
	filterSearchForm.init({
		element: document.getElementById('filterSearchForm'),
		trigger: document.getElementById('filterSearchFormTrigger')
	});


	// иницализация работы таблиц с данными
	$('.datagrid').each(function() {
		var self = this;
		new DataGrid({
			element: self,
			// номер ячейки, для которой выставлять отступ (отсчет с 0)
			gutterCellIndex: 1,
			//величина, на которую будет увеличиваться отсуп в ячейках
			cellGutter: 16
		});
	});


	// инициализация выпадающих списков
	// список в меню пользователя
	new DropBlock({
		element: document.getElementById('user-drop'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('user_active');
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('user_active');
		}
	});

	// список "Справочные материалы"
	new DropBlock({
		element: document.getElementById('help-docs-menu'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('page-menu__link_active');
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('page-menu__link_active');
		}
	});

	// список в тулбаре редактирования документов
	new DropBlock({
		element: document.getElementById('reestr-list'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('btn_active');
			$(element).addClass('tool_active');
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('btn_active');
			$(element).removeClass('tool_active');
		}
	});

	// фильтр поиска
	new DropBlock({
		element: document.getElementById('search-filter'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('btn_active');
			$(element).addClass('tool_active');
			filterSearchForm.open();
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('btn_active');
			$(element).removeClass('tool_active');
			filterSearchForm.close();
		}
	});

	// древовидная диаграмма проектов
	new DropBlock({
		element: document.getElementById('project-tree'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('btn_active');
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('btn_active');
		}
	});

	// инструменты управления письмом
	new DropBlock({
		element: document.getElementById('message-tools'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('btn_active');
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('btn_active');
		}
	});

	// список сообщений в шапке
	new DropBlock({
		element: document.getElementById('notif-messages'),
		onOpen: function(element, trigger, dropElement) {
			$(trigger).addClass('user-toolbar__link_active');
		},
		onClose: function(element, trigger, dropElement) {
			$(trigger).removeClass('user-toolbar__link_active');
		}
	});


	// стилизация выпадающих списков с помощью select2
	var $selects = $('.js-select');

	if ($selects.length > 0) {
		$selects.select2();
	}


	// календари
	var $calendars = $('.js-datepicker');

	if ($calendars.length > 0) {
		$calendars
			.datepicker({
				showOtherMonths: true,
				selectOtherMonths: true,
				dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
				dayNames: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
				firstDay: 1,
				monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
				monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
				dateFormat: "dd.mm.yy",
				showOn: "button",
				buttonText: "",
				onSelect: function () {
					console.log('test');
				}
			});

		// $calendars.inputmask("99.99.9999");
	};


	// инициализация вида сплит-панелей на странице Реестра
	if ($('#reestr-layout').length > 0) {
		$('#reestr-layout').enhsplitter({
			vertical: false,
			minSize: 260
		});
	};

	// инициализация вида сплит-панелей на странице Сообщений
	// используется jQuery UI resizable
	if ($('#messages-view').length > 0) {
		$('.messages-view__side').resizable({
			containment: '.messages-view',
			handles: 'e',
			minWidth: 360,
			maxWidth: 800
		});
	};


	// работа меню с боквой панелью в карточках и mail-клиенте

	if ($('.menu-layout__toggle').length > 0 && $('.menu-layout').length > 0) {
		$('.menu-layout__toggle').on('click', function(e) {
			e.preventDefault();
			$(e.target)
				.closest('.menu-layout')
				.toggleClass('menu-layout_open');
		});

		$('.menu-list').css({
			'margin-right': -utils.getScrollBarValue() + 'px'
		});
	}


	// сворачивание панели с полями ввода в карточках
	if ($('.card').length > 0 && $('.card__toggle').length > 0) {
		$(document).on('click', '.card__toggle', function(e) {
			var $target = $(e.target),
				$head = $target.closest('.card__head'),
				$fields = $head.find('.card__head-fields');

			if ($head.hasClass('card__head_collapsed')) {
				$fields.slideDown('fast', function() {
					$head.removeClass('card__head_collapsed');
				});
			} else {
				$fields.slideUp('fast', function() {
					$head.addClass('card__head_collapsed');
				});
			};
		});
	}


	// подсказки в полях ввода
	if($('.field-info').length > 0) {
		$(document)
			.on('click', function(e) {
				$('.field-info').removeClass('field-info_active');
			})
			.on('click', '.field-info', function(e) {
				e.stopPropagation();
				$(this).toggleClass('field-info_active');
				$('.field-info').not(this).removeClass('field-info_active');
			})
	}

});