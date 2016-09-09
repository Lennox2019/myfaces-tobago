/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Tobago = {

  // -------- Constants -------------------------------------------------------

  /**
   * Component separator constant
   * @const
   * @type {string}
   */
  COMPONENT_SEP: ':',

  /**
   * Tobago's subComponent separator constant
   * @const
   * @type {string}
   */
  SUB_COMPONENT_SEP: '::',

  // -------- Variables -------------------------------------------------------

  /**
   * The html form object of current page.
   * set via init function
   */
  form: null,

  /**
   * The id of the element which should became the focus after loading.
   * Set via renderer if requested.
   */
  focusId: undefined,

  errorFocusId: undefined,

  lastFocusId: undefined,

  /**
   * The resize action is a function which should be executed when the window was resized.
   * Can be defined as facet in the page.
   */
  resizeAction: undefined,
  resizeEventCount: 0,

  htmlIdIndex: 0,

  createHtmlId: function() {
    var id = '__tbg_id_' + this.htmlIdIndex++;
    console.debug('created id = ' + id); // @DEV_ONLY
    return id;
  },

  reloadTimer: {},

  jsObjects: [],

  eventListeners: [],

  /**
    * Check browser types and versions.
    * Please try to use jQuery.support instead of this object!
    */
  browser: {
    isMsie: false,
    isMsie6: false,
    isMsie67: false,
    isMsie678: false,
    isMsie6789: false,
    isMsie678910: false,
    isGecko: false,
    isWebkit: false
  },

  isSubmit: false,

  initMarker: false,

  listeners: {
    documentReady: [[], [], [], []],
    windowLoad: [[], [], [], []],
    beforeSubmit: [[], [], [], []],
    afterUpdate: [[], [], [], []],
    beforeUnload: [[], [], [], []],
    beforeExit: [[], [], [], []]
  },

  // -------- Functions -------------------------------------------------------

  /**
   * Register a function to be executed on certain events.
   * @param listener Function to be executed.
   * @param phase The phase when code should be executed (e. g. Tobago.Phase.DOCUMENT_READY).
   * @param order An optional order to sort function they depend on others (default: Tobago.Phase.Order.NORMAL).
   */
  registerListener: function(listener, phase, order) {

    if (order == undefined) {
      order = Tobago.Phase.Order.NORMAL;
    }

    var phaseMap;
    if (Tobago.Phase.DOCUMENT_READY == phase) {
      phaseMap = Tobago.listeners.documentReady;
    } else if (Tobago.Phase.WINDOW_LOAD == phase) {
      phaseMap = Tobago.listeners.windowLoad;
    } else if (Tobago.Phase.BEFORE_SUBMIT == phase) {
      phaseMap = Tobago.listeners.beforeSubmit;
    } else if (Tobago.Phase.AFTER_UPDATE == phase) {
      phaseMap = Tobago.listeners.afterUpdate;
    } else if (Tobago.Phase.BEFORE_UNLOAD == phase) {
      phaseMap = Tobago.listeners.beforeUnload;
    } else if (Tobago.Phase.BEFORE_EXIT == phase) {
      phaseMap = Tobago.listeners.beforeExit;
    } else {
      console.error("Unknown phase: " + phase); // @DEV_ONLY
      return;
    }

    phaseMap[order].push(listener);
  },

  findPage: function() {
    return jQuery(".tobago-page");
  },

  findForm: function() {
    return Tobago.findSubElementOfPage("form");
  },

  /**
   * Find a sub-element of the page. Like the form with id e.g. page::form
   * @param suffix
   */
  findSubElementOfPage: function(suffix) {
    return jQuery(Tobago.Utils.escapeClientId(Tobago.findPage().attr("id") + Tobago.SUB_COMPONENT_SEP + suffix));
  },

  /**
   * Tobago's central init function.
   * Called when the document (DOM) is ready
   */
  init: function() {

    if (this.initMarker) {
      return;
    }
    this.initMarker = true;

    console.time("[tobago] init"); // @DEV_ONLY
    console.time("[tobago] init (main thread)"); // @DEV_ONLY
    this.addBindEventListener(Tobago.findForm().get(0), 'submit', this, 'onSubmit');

    this.addBindEventListener(window, 'unload', this, 'onUnload');

    for (var order = 0; order < Tobago.listeners.documentReady.length; order++) {
      var list = Tobago.listeners.documentReady[order];
      for (var i = 0; i < list.length; i++) {
        console.time("[tobago] init " + order + " " + i); // @DEV_ONLY
        list[i]();
        console.timeEnd("[tobago] init " + order + " " + i); // @DEV_ONLY
      }
    }

    console.time("[tobago] applicationOnload"); // @DEV_ONLY
    if (this.applicationOnload) {
      this.applicationOnload();
    }
    console.timeEnd("[tobago] applicationOnload"); // @DEV_ONLY

    if (Tobago.resizeAction) {
      // firefox submits an onresize event
      window.setTimeout(Tobago.registerResizeAction, 1000);
    }

    window.setTimeout(Tobago.finishPageLoading, 1);
    console.timeEnd("[tobago] init (main thread)"); // @DEV_ONLY
  },

  finishPageLoading: function() {
    Tobago.setFocus();
    console.timeEnd("[tobago] init"); // @DEV_ONLY
  },

  registerResizeAction: function() {
    Tobago.addEventListener(window, 'resize', Tobago.resizePage);
  },

  onSubmit: function(listenerOptions) {
    var result = true; // Do not continue if any function returns false
    for (var order = 0; order < Tobago.listeners.beforeSubmit.length; order++) {
      var list = Tobago.listeners.beforeSubmit[order];
      for (var i = 0; i < list.length; i++) {
        result = list[i](listenerOptions);
        if (result == false) {
          break;
        }
      }
    }
    if (result == false) {
      this.isSubmit = false;
      return false;
    }

    this.isSubmit = true;

    Tobago.onBeforeUnload();

    return true;
  },

  onBeforeUnload: function() {
    if (Tobago.transition) {
      jQuery("body").overlay();
    }
    Tobago.transition = Tobago.oldTransition;
  },

  preparePartialOverlay: function(options) {
    if (options.transition === undefined || options.transition == null || options.transition) {
      console.info("options.render: " + options.render); // @DEV_ONLY
      if (options.render) {
        var partialIds = options.render.split(" ");
        for (var i = 0; i < partialIds.length; i++) {
          console.info("partialId: " + partialIds[i]); // @DEV_ONLY
          var element = jQuery(Tobago.Utils.escapeClientId(partialIds[i]));
          element.data("tobago-partial-overlay-set", true);
          element.overlay({ajax: true});
        }
      }
    }
  },

  /**
   * Wrapper function to call application generated onunload function
   */
  onUnload: function() {

    var phase = this.isSubmit ? Tobago.listeners.beforeUnload : Tobago.listeners.beforeExit;

    for (var order = 0; order < phase.length; order++) {
      var list = phase[order];
      for (var i = 0; i < list.length; i++) {
        list[i]();
      }
    }

    // deprecated:
    if (this.isSubmit && this.applicationOnunload) {
      this.applicationOnunload();
    } else if (!this.isSubmit && this.applicationOnexit) {
      this.applicationOnexit();
    }
    this.destroyObjects();
  },

  addJsObject: function(obj) {
    this.jsObjects[this.jsObjects.length] = obj;
  },

  destroyObjects: function() {
    this.removeEventListeners();

    for (var i = 0; i < this.jsObjects.length; i++) {
      try {
        this.destroyObject(this.jsObjects[i]);
      } catch (ex) {
        // ignore
      }
    }
    this.jsObjects.length = 0;
    delete this.jsObjects;
    delete this.lastFocusId;
  },

  removeEventListeners: function() {
    var count = 0;
    for (var i = 0; i < this.eventListeners.length; i++) {
      var el = this.eventListeners[i];
      this.removeEventListener(el);
      delete el.element;
      delete el.event;
      delete el.func;
      this.eventListeners[i] = undefined;
      count++;
    }
    delete this.eventListeners;
//    alert(count + " EverntListener geloescht");
  },

  destroyObject: function(obj) {
    if (obj.htmlElement) {
      // test
      delete obj.htmlElement.jsObjects;
      delete obj.htmlElement;
    } else {
      // Unknown Object --> delete all properties
      if (typeof obj == 'Object') {
        this.destroyJsObject(obj);
      } else if (typeof obj == 'Array') {
        obj.length = 0;
        delete obj;
      }
    }
  },

  destroyJsObject: function(obj) {
    try {
      for (var item in obj) {
        delete obj[item];
      }
      delete obj;
    } catch (ex) {
      // ignore
    }
  },

  /**
   * Submitting the page with specified actionId.
   * options.transition
   * options.target
   * options.focus
   */
  submitAction: function(source, actionId, options) {
    options = options || {};

    var transition = options.transition === undefined || options.transition == null || options.transition;

    Tobago.findSubElementOfPage("lastFocusId").val(options.focus);

    Tobago.Transport.request(function() {
      if (!this.isSubmit) {
        this.isSubmit = true;
        var form = Tobago.findForm();
        var oldTarget = form.attr("target");
        var $sourceHidden = jQuery(Tobago.Utils.escapeClientId("javax.faces.source"));
        $sourceHidden.prop("disabled", false);
        $sourceHidden.val(actionId);
        if (options.target) {
          form.attr("target", options.target);
        }
        Tobago.oldTransition = Tobago.transition;
        Tobago.transition = transition && !options.target;

        var listenerOptions = {
          source: source,
          actionId: actionId,
          options: options
        };
        var onSubmitResult = Tobago.onSubmit(listenerOptions);
        if (onSubmitResult) {
          try {
            // console.debug("submit form with action: " + Tobago.action.value);
            form.get(0).submit();
            if (Tobago.browser.isMsie) {
              // without this "redundant" code the animation will not be animated in IE (tested with 6,7,8,9,10,11)
              var image = jQuery(".tobago-page-overlayCenter img");
              image.appendTo(image.parent());
            }
          } catch (e) {
            Tobago.findPage().overlay("destroy");
            Tobago.isSubmit = false;
            alert('Submit failed: ' + e); // XXX localization, better error handling
          }
        }
        if (options.target) {
          form.attr("target", oldTarget);
        }
        if (options.target || !transition || !onSubmitResult) {
          this.isSubmit = false;
          Tobago.Transport.pageSubmitted = false;
        }
      }
      if (!this.isSubmit) {
        Tobago.Transport.requestComplete(); // remove this from queue
      }


    }, true);
  },

  getJsfState: function() {
    var stateContainer = Tobago.findSubElementOfPage("jsf-state-container").get(0);
    var jsfState = "";
    if (stateContainer) {
      for (var i = 0; i < stateContainer.childNodes.length; i++) {
        var child = stateContainer.childNodes[i];
        if (child.tagName == 'INPUT') {
          if (jsfState.length > 0) {
            jsfState += '&';
          }
          jsfState += encodeURIComponent(child.name);
          jsfState += '=';
          jsfState += encodeURIComponent(child.value);
        }
      }
    }
//    console.debug("jsfState = " + jsfState);
    return jsfState;
  },

  clearReloadTimer: function(id) {
    var timer = Tobago.reloadTimer[id];
    if (timer) {
      clearTimeout(timer);
    }
  },

  addReloadTimeout: function(id, func, time) {
    Tobago.clearReloadTimer(id);
    Tobago.reloadTimer[id] = setTimeout(func, time);
  },

  /**
   * Focus function for toolbar buttons.
   *  IE only.
   */
  toolbarFocus: function(element, event) {
    if (window.event && event.altKey) {
      // ie only set focus on keyboard access, so do the click here.
      //console.debug(" alt=" + event.altKey + "  keycode=" + event.keyCode)
      element.click();
    }
  },

  resizePage: function(event) {
    Tobago.resizeEventCount++;
    window.setTimeout(Tobago.resizePageAction, 250);
  },

  resizePageAction: function() {
    Tobago.resizeEventCount--;
    if (Tobago.resizeEventCount == 0) {
      Tobago.resizeAction();
    }
  },

  initCommand: function(command) {
    // command is jQuery object
    // setupInputFacetCommand
    var commands = command.data("tobago-commands");

    if (commands.click) {
      command.click(function (event) {
        var confirmation = commands.click.confirmation;
        if (confirmation != null) {
          if (!confirm(confirmation)) {
            event.preventDefault();
            return;
          }
        }
        var collapse = commands.click.collapse;
        if (collapse) {
          Tobago.Collapse.execute(collapse);
        }

        if (commands.click.omit != true) {
          var popup = commands.click.popup;
          if (popup && popup.command == "close" && popup.immediate) {
            Tobago.Popup.close(this);
          } else {
            var action = commands.click.action ? commands.click.action : jQuery(this).attr("id");
            if (commands.click.execute || commands.click.render) {
              Tobago.preparePartialOverlay(commands.click);
              jsf.ajax.request(
                  jQuery(this).attr("id"),
                  event,
                  {
                    "javax.faces.behavior.event": "click",
                    execute: commands.click.execute,
                    render: commands.click.render
                  });
              event.preventDefault();
              event.stopPropagation();
            } else {
              Tobago.submitAction(this, action, commands.click);
            }
            if (popup && popup.command == "close") {
              Tobago.Popup.close(this);
            }
          }
        }
      });
    }
    if (commands.change) {
      command.change(function(event) {
        if (commands.change.execute || commands.change.render) {
          jsf.ajax.request(
              jQuery(this).attr("name"),
              event,
              {
                "javax.faces.behavior.event": "change",
                execute: commands.change.execute,
                render: commands.change.render
              });
        } else {
          Tobago.submitAction(this, commands.change.action, commands.change);
        }
      });
    }
    if (commands.complete) {
      if (commands.complete.execute || commands.complete.render) {
        jsf.ajax.request(
            jQuery(this).attr("id"),
            null,
            {
              "javax.faces.behavior.event": "complete",
              execute: commands.complete.execute,
              render: commands.complete.render
            });
      } else {
        Tobago.submitAction(this, commands.complete.action, commands.complete);
      }
    }
    if (commands.resize) {
      Tobago.resizeAction = function() {
        Tobago.submitAction(this, commands.resize.action, commands.resize);
      }
    }
    if (commands.action) {
      setTimeout(function () {
            Tobago.submitAction(this, commands.action.action, commands.action);
          },
          commands.action.delay || 100);
    }
  },

  initDom: function(elements) {

    // focus
    var autofocus = Tobago.Utils.selectWithJQuery(elements, '[autofocus]');
    autofocus.each(function () {
      // setupFocus
      Tobago.focusId = jQuery(this).attr("id");
      Tobago.setFocus();
    });

    // commands
    Tobago.Utils.selectWithJQuery(elements, '[data-tobago-commands]')
        .each(function () {Tobago.initCommand(jQuery(this));});

    Tobago.initScrollPosition(elements ? elements : jQuery(".tobago-page"));
  },

  initScrollPosition: function(elements) {
    var scrollPanels;
    if (elements.data("tobago-scroll-panel")) {
      scrollPanels = elements;
    } else {
      scrollPanels = elements.find("[data-tobago-scroll-panel]");
    }
    scrollPanels.bind("scroll", function () {
      var panel = jQuery(this);
      var scrollLeft = panel.prop("scrollLeft");
      var scrollTop = panel.prop("scrollTop");
      // store the position in a hidden field
      panel.children("[data-tobago-scroll-position]").val(scrollLeft + ";" + scrollTop);
    });
    scrollPanels.each(function () {
      var panel = jQuery(this);
      var hidden = panel.children("[data-tobago-scroll-position]");
      var sep = hidden.val().indexOf(";");
      if (sep != -1) {
        var scrollLeft = hidden.val().substr(0, sep);
        var scrollTop = hidden.val().substr(sep + 1);
        panel.prop("scrollLeft", scrollLeft);
        panel.prop("scrollTop", scrollTop);
      }
    });
  },

  initCss: function (elements) {
    // element styles
    console.time("[tobago] initCss"); // @DEV_ONLY
    Tobago.Utils.selectWithJQuery(elements, "[data-tobago-style]").each(function () {
      var element = jQuery(this);
      var data = element.data("tobago-style");

      // set only known properties (because of security)
      element.css({
        width: data.width,
        height: data.height,

        minWidth: data.minWidth,
        minHeight: data.minHeight,
        maxWidth: data.maxWidth,
        maxHeight: data.maxHeight,

        left: data.left,
        right: data.right,
        top: data.top,
        bottom: data.bottom,

        paddingLeft: data.paddingLeft,
        paddingRight: data.paddingRight,
        paddingTop: data.paddingTop,
        paddingBottom: data.paddingBottom,

        marginLeft: data.marginLeft,
        marginRight: data.marginRight,
        marginTop: data.marginTop,
        marginBottom: data.marginBottom,

        overflowX: data.overflowX,
        overflowY: data.overflowY,
        display: data.display,
        position: data.position,

        backgroundImage: data.backgroundImage,         // TBD
        backgroundPosition: data.backgroundPosition,   // TBD
        zIndex: data.zIndex, // TBD: needed? will be set by Tobago? check org.apache.myfaces.tobago.renderkit.css.Style
        textAlign: data.textAlign
      });
    });

    console.timeEnd("[tobago] initCss"); // @DEV_ONLY
  },

  /* supports only two background images in the moment */
  fixMultiBackgroundIE8: function (element) {
    var style = element.data("tobago-style");
    var index;
    var backgroundImage = style.backgroundImage;
    var backgroundImage2;
    if (backgroundImage) {
      index = backgroundImage.indexOf(",");
      if (index > -1) {
        style.backgroundImage = backgroundImage.substring(0, index);
        backgroundImage2 = backgroundImage.substring(index + 1);
      }
    }
    var backgroundPosition = style.backgroundPosition;
    var backgroundPosition2;
    if (backgroundPosition) {
      index = backgroundPosition.indexOf(",");
      if (index > -1) {
        style.backgroundPosition = backgroundPosition.substring(0, index);
        backgroundPosition2 = backgroundPosition.substring(index + 1);
      }
    }
    if (backgroundImage2) {
      var extra = jQuery("<span>").appendTo(element);
      extra.css({
        backgroundImage: backgroundImage2,
        backgroundPosition: backgroundPosition2,
        backgroundRepeat: "no-repeat",
        position: "absolute",
        left: "0",
        right: "0",
        top: "0",
        bottom: "0"
      });
      element.css({
        position: "relative"
      });
    }
  },

  preventFrameAttacks: function() {
    if (self == top) {
      jQuery(".tobago-page-preventFrameAttacks").removeClass("tobago-page-preventFrameAttacks");
    } else {
      if (jQuery(".tobago-page-preventFrameAttacks").size() > 0) { // preventFrameAttacks is true
        var page = Tobago.findPage();
        page.attr("title", "This application can't be used embedded inside an other site " +
        "(configuration: prevent-frame-attacks=true)!");
        jQuery("<i>")
            .addClass("fa fa-flash")
            .css({fontSize: "xx-large", margin: "20px"})
            .appendTo(page);
        page.addClass("alert-danger");
      }
    }
  },

// -------- Util functions ----------------------------------------------------

  /**
   * Sets the focus to the requested element or to the first possible if
   * no element is explicitly requested.
   */
  setFocus: function() {
    var elementId;
    if (this.errorFocusId !== undefined) {
      elementId = this.errorFocusId;
    } else if (this.lastFocusId !== undefined) {
      elementId = this.lastFocusId;
    } else {
      elementId = this.focusId;
    }
    if (elementId != null) {
      var $focusElement = jQuery(Tobago.Utils.escapeClientId(elementId));
      if ($focusElement.size() > 0) {
        try { // focus() on not visible elements breaks IE
          $focusElement.focus();
          return;
        } catch (ex) {
          console.warn('Exception when setting focus on : \"' + elementId + '\"'); // @DEV_ONLY
        }
      }
    }

    if (typeof this.focusId == 'undefined') {
      var lowestTabIndex = 32768; // HTML max tab index value + 1
      var candidate = null;
      var candidateWithTabIndexZero = null;
      foriLoop: for (var i = 0; i < document.forms.length; i++) {
        var form = document.forms[i];
        if (form != null) {
          for (var j = 0; j < form.elements.length; j++) {
            var element = form.elements[j];
            if (element != null) {
              if (!element.disabled && !element.readOnly
                  && this.isFocusType(element.type)) {
                if (lowestTabIndex > element.tabIndex && element.tabIndex > 0) {
                  lowestTabIndex = element.tabIndex;
                  candidate = element;
                  if (lowestTabIndex == 1) {
                    // optimization: stop on first field with lowest possible tab index 1
                    break foriLoop;
                  }
                }
                if (candidateWithTabIndexZero == null && element.tabIndex == 0) {
                  candidateWithTabIndexZero = element;
                }
              }
            }
          }
        }
      }
      if (candidate != null) {
        try {
          // focus() on not visible elements breaks IE
          candidate.focus();
        } catch (ex) {
        }
      } else if (candidateWithTabIndexZero != null) {
        try {
          // focus() on not visible elements breaks IE
          candidateWithTabIndexZero.focus();
        } catch (ex) {
        }
      }
    } else if (this.focusId.length > 0) {
      console.warn('Cannot find component to set focus : \"' + this.focusId + '\"'); // @DEV_ONLY
    }

  },


  /**
   * check if a component type is valid to receive the focus
   */
  isFocusType: function(type) {
    if (type == 'text'
        || type == 'textarea'
        || type == 'select-one'
        || type == 'select-multiple'
      //       ||  type == 'button'
        || type == 'checkbox'
      // || type == 'file'
        || type == 'password'
        || type == 'radio'
        || type == 'reset'
        || type == 'submit'
        ) {
      return true;
    }
    else {
      return false;
    }
  },

  /**
   * Create a HTML input element with given type, name and value.
   */
  createInput: function(type, name, value) {
    var input = document.createElement('INPUT');
    if (type) {
      input.type = type;
    }
    if (name) {
      input.name = name;
    }
    if (value) {
      input.value = value;
    }
    return input;
  },

  /**
   * Clear the selection.
   */
  clearSelection: function() {
    if (document.selection) {  // IE
      try {
        document.selection.empty();
      } catch (error) {
        // Ignore error: seems to be a browser bug (TOBAGO-1201)
      }
    } else if (window.getSelection) {  // GECKO
      window.getSelection().removeAllRanges();
    }
  },

  /**
   * Add an event listener to an HTML element
   */
  addEventListener: function(element, event, myFunction) {
    var el = new Tobago.EventListener(element, event, myFunction);
    if (el.element.addEventListener) { // this is DOM2
      el.element.addEventListener(el.event, el.func, false);
    } else { // IE
      el.element.attachEvent('on' + el.event, el.func);
    }
  },

  /**
   * Remove an event listener from an HTML element
   */
  removeEventListener: function(element, event, myFunction) {
    if (!event && !myFunction && element.element && element.event && element.func) {
      myFunction = element.func;
      event = element.event;
      element = element.element;
    }
    if (element.removeEventListener) { // this is DOM2
      element.removeEventListener(event, myFunction, true);
    }
    else if (element.detachEvent) {  // IE
      element.detachEvent('on' + event, myFunction);
    } else {
      console.debug('Unknown Element: ' + typeof element); // @DEV_ONLY
    }

  },

  /**
   * Returns a function which binds the named function 'func' of the object 'object'.
   * additional arguments to bind function are added to the arguments at
   * function call.
   * E.g.:
   * var f = Tobago.bind(Tobago, "setElementWidth");
   * will bind Tobago.setElementWidth(...) to f(...)
   * and
   * var f = Tobago.bind(Tobago, "setElementWidth", id, width);
   * will bind Tobago.setElementWidth(id, widt) to f()
   * and
   * var f = Tobago.bind(Tobago, "setElementWidth", width);
   * will bind Tobago.setElementWidth(id, width) to f(id)
   *
   */
  bind: function(object, func) {
    var rest = [];
    for (var i = 2; i < arguments.length; i++) {
      rest.push(arguments[i]);
    }
    return function() {
      var args = [];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      object[func].apply(object, args.concat(rest));
    };
  },

  bind2: function(object, func) {
    var rest = [];
    for (var i = 2; i < arguments.length; i++) {
      rest.push(arguments[i]);
    }
    return function() {
      for (var i = 0; i < arguments.length; i++) {
        rest.push(arguments[i]);
      }
      object[func].apply(object, rest);
    };
  },

  /**
   * Returns a function which binds the named function 'func' of the object 'object'
   * as eventListener.
   * E.g.:
   * var f = Tobago.bindAsEventListener(Tobago, "doSomthing");
   * will bind Tobago.doSomthing(event) to f(event)
   */
  bindAsEventListener: function(object, func) {
    return function(event) {
      object[func].call(object, event || window.event);
    };
  },

  /**
   * Adds a function which binds the named function 'func' of the object 'object'
   * as eventListener to an element.
   */
  addBindEventListener: function(element, event, object, func) {
    this.addEventListener(element, event, this.bindAsEventListener(object, func));
  },


  /**
   * Stop event bubbling
   */
  stopEventPropagation: function(event) {
    if (! event) {
      event = window.event;
    }
    event.cancelBubble = true;  // this is IE, no matter if not supported by actual browser
    if (event.stopPropagation) {
      event.stopPropagation(); // this is DOM2
    }
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }
  },

  /**
   * Returns the absolute top value, related to the body element, for an HTML element.
   */
  getAbsoluteTop: function(element) {
    var top = 0;
    var parent = false;
    while (element && element.offsetParent) {
      top += element.offsetTop;
      top -= element.scrollTop;
      if (parent && element.currentStyle) { // IE only
        top += element.currentStyle.borderTopWidth.replace(/\D/g, '') - 0;
      }
      element = element.offsetParent;
      parent = true;
    }
    return Math.max(top, 0);
  },

  extend: function(target, source) {
    for (var property in source) {
      target[property] = source[property];
    }
    return target;
  },

  raiseEvent: function(eventType, element) {
    var event;
    if (document.createEvent) {
      event = document.createEvent('Events');
      event.initEvent(eventType, true, true);
      element.dispatchEvent(event);
    }
    else if (document.createEventObject) {
      event = document.createEventObject();
      element.fireEvent('on' + eventType, event);
    }
  },

  toString: function(element) {
    var result = '';
    for (var property in element) {
      if (property && element[property]) {
        var value = '' + element[property];
        if (value != '') {
          result += '\r\n' + property + '=' + value;
        }
      }
    }
    return result;
  },

  initBrowser: function() {
    var ua = navigator.userAgent;
    if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) {
      Tobago.browser.isMsie = true;
      if (ua.indexOf("MSIE 6") > -1) {
        Tobago.browser.isMsie6 = true;
        Tobago.browser.isMsie67 = true;
        Tobago.browser.isMsie678 = true;
        Tobago.browser.isMsie6789 = true;
        Tobago.browser.isMsie678910 = true;
      } else if (ua.indexOf("MSIE 7") > -1) {
        Tobago.browser.isMsie67 = true;
        Tobago.browser.isMsie678 = true;
        Tobago.browser.isMsie6789 = true;
        Tobago.browser.isMsie678910 = true;
      } else if (ua.indexOf("MSIE 8") > -1) {
        Tobago.browser.isMsie678 = true;
        Tobago.browser.isMsie6789 = true;
        Tobago.browser.isMsie678910 = true;
      } else if (ua.indexOf("MSIE 9") > -1) {
        Tobago.browser.isMsie6789 = true;
        Tobago.browser.isMsie678910 = true;
      } else if (ua.indexOf("MSIE 10") > -1) {
        Tobago.browser.isMsie678910 = true;
      }
    } else if (ua.indexOf("AppleWebKit") > -1) {
      Tobago.browser.isWebkit = true;
    } else if (ua.indexOf("Gecko") > -1) {
      Tobago.browser.isGecko = true;
    }
  }
};

Tobago.initBrowser();

jQuery(document).ready(function() {
  Tobago.init();
});

jQuery(window).load(function() {
  for (var order = 0; order < Tobago.listeners.windowLoad.length; order++) {
    var list = Tobago.listeners.windowLoad[order];
    for (var i = 0; i < list.length; i++) {
      list[i]();
    }
  }
});

Tobago.Phase = {
  /** after the DOM was build */
  DOCUMENT_READY:{},
  /** after all images and CSS was loaded */
  WINDOW_LOAD:{},
  /** before sending a normal submit action */
  BEFORE_SUBMIT:{},
  /** after an AJAX call */
  AFTER_UPDATE:{},
  /** before ending a page */
  BEFORE_UNLOAD:{},
  /** before closing a window or tab */
  BEFORE_EXIT:{},

  Order:{
    EARLY:0,
    NORMAL:1,
    LATE:2,
    LATER:3
  }
};

Tobago.Config = {
  set: function(name, key, value) {
    if (!this[name]) {
      this[name] = {};
    }
    this[name][key] = value;
  },

  get: function(name, key) {
    while (name && !(this[name] && this[name][key])) {
      name = this.getFallbackName(name);
    }

    if (name) {
      return this[name][key];
    } else {
      console.warn("Tobago.Config.get(" + name + ", " + key + ") = undefined"); // @DEV_ONLY
      return 0;
    }
  },

  fallbackNames: {},

  getFallbackName: function(name){
    if (this.fallbackNames[name]) {
      return this.fallbackNames[name];
    } else if (name == "Tobago") {
      return undefined;
    } else {
      return "Tobago";
    }
  }
};

Tobago.Config.set("Tobago", "themeConfig", "standard/standard");
Tobago.registerListener(Tobago.preventFrameAttacks, Tobago.Phase.DOCUMENT_READY);
// using Tobago.Phase.Order.LATE, because the command event generated by data-tobago-commands
// may produce a submit, but we need to do something before the submit (and also on click,
// e. g. selectOne in a toolBar).
Tobago.registerListener(Tobago.initDom, Tobago.Phase.DOCUMENT_READY, Tobago.Phase.Order.LATER);
Tobago.registerListener(Tobago.initDom, Tobago.Phase.AFTER_UPDATE, Tobago.Phase.Order.LATER);

// the inline css should be applied early, so that other init functions can use the dimensions
Tobago.registerListener(Tobago.initCss, Tobago.Phase.DOCUMENT_READY, Tobago.Phase.Order.EARLY);
Tobago.registerListener(Tobago.initCss, Tobago.Phase.AFTER_UPDATE, Tobago.Phase.Order.EARLY);

// XXX: 2nd parameter enableAjax is deprecated
Tobago.Panel = function(panelId, enableAjax, autoReload) {
  this.id = panelId;
  this.autoReload = autoReload;
  this.options = {
  };

  this.setup();
};

Tobago.Panel.init = function(elements) {
  var reloads = Tobago.Utils.selectWithJQuery(elements, ".tobago-panel[data-tobago-reload]");
  reloads.each(function(){
    var id = jQuery(this).attr("id");
    var period = jQuery(this).data("tobago-reload");
    new Tobago.Panel(id, true, period);
  });
};

Tobago.Panel.prototype.setup = function() {
  this.initReload();
};


Tobago.Panel.prototype.initReload = function() {
  if (typeof this.autoReload == 'number' && this.autoReload > 0) {
    Tobago.addReloadTimeout(this.id, Tobago.bind2(this, 'reloadWithAction', null, this.id), this.autoReload);
  }
};

Tobago.Panel.prototype.reloadWithAction = function(source, action) {
  jsf.ajax.request(
      action,
      null,
      {
        "javax.faces.behavior.event": "reload",
        execute: this.id,
        render: this.id
      });
};

Tobago.registerListener(Tobago.Panel.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.Panel.init, Tobago.Phase.AFTER_UPDATE);

Tobago.EventListener = function(element, event, func) {
  this.element = element;
  this.event = event;
  this.func = func;
  Tobago.eventListeners[Tobago.eventListeners.length] = this;
};

Tobago.Transport = {
  requests: [],
  currentActionId: null,
  pageSubmitted: false,

  /**
   * @return true if the request is queued.
   */
  request: function(req, submitPage, actionId) {
    var index = 0;
    if (submitPage) {
      this.pageSubmitted = true;
      index = this.requests.push(req);
      //console.debug('index = ' + index)
    } else if (!this.pageSubmitted) { // AJAX case
      console.debug('Current ActionId = ' + this.currentActionId + ' action= ' + actionId); // @DEV_ONLY
      if (actionId && this.currentActionId == actionId) {
        console.info('Ignoring request'); // @DEV_ONLY
        // If actionId equals currentActionId assume double request: do nothing
        return false;
      }
      index = this.requests.push(req);
      //console.debug('index = ' + index)
      this.currentActionId = actionId;
    } else {
      console.debug("else case"); // @DEV_ONLY
      return false;
    }
    console.debug('index = ' + index);  // @DEV_ONLY
    if (index == 1) {
      console.info('Execute request!'); // @DEV_ONLY
      this.startTime = new Date().getTime();
      this.requests[0]();
    } else {
      console.info('Request queued!'); // @DEV_ONLY
    }
    return true;
  },


// TBD XXX REMOVE is this called in non AJAX case?
  
  requestComplete: function() {
    this.requests.shift();
    this.currentActionId = null;
    console.debug('Request complete! Duration: ' + (new Date().getTime() - this.startTime) + 'ms; Queue size : ' + this.requests.length); // @DEV_ONLY
    if (this.requests.length > 0) {
      console.debug('Execute request!'); // @DEV_ONLY
      this.startTime = new Date().getTime();
      this.requests[0]();
    }
  }
};

// -------- ToolBar ----------------------------------------------------

Tobago.ToolBar = {};

/**
 * Initializes the tool bars.
 * @param elements  a jQuery object to initialize (ajax) or null for initializing the whole document (full load).
 */
Tobago.ToolBar.init = function(elements) {

  Tobago.Utils.selectWithJQuery(elements, ".tobago-tabGroup-toolBar")
      .find(".tobago-menu[data-tobago-index]").each(function () {
        var menu = jQuery(this);
        menu.data("tobago-tabGroup", menu.closest(".tobago-tabGroup"));
        menu.click(function (event) {
          var menu = jQuery(this);
          var tabGroup = menu.data("tobago-tabGroup");
          var tab = tabGroup.find(".tobago-tab[tabgroupindex=" + menu.data("tobago-index") + "]");
          tab.click();
          event.stopPropagation();
        })
      });

  Tobago.Utils.selectWithJQuery(elements, ".tobago-toolBar-selectOne").find(".tobago-toolBar-button")
      .click(function () {
        var button = jQuery(this);
        var hidden = button.closest(".tobago-toolBar-selectOne").children("input[type=hidden]");
        hidden.val(button.data("tobago-value"));
      });

  Tobago.Utils.selectWithJQuery(elements, ".tobago-toolBar-selectBoolean").find(".tobago-toolBar-button")
      .click(function () {
        var button = jQuery(this);
        var hidden = button.closest(".tobago-toolBar-selectBoolean").children("input[type=hidden]");
        hidden.val(hidden.val() == "true" ? "false" : "true");
      });
};

Tobago.registerListener(Tobago.ToolBar.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.ToolBar.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Commands

Tobago.Command = {};

Tobago.Command.initEnter = function(elements) {
  var page = Tobago.Utils.selectWithJQuery(elements, ".tobago-page");
  page.keypress(function (event) {
    var code = event.which;
    if (code == 0) {
      code = event.keyCode;
    }
    if (code == 13) {
      var target = event.target;
      if (target.tagName == "A" || target.tagName == "BUTTON") {
        return;
      }
      if (target.tagName == "TEXTAREA") {
        if (!event.metaKey && !event.ctrlKey) {
          return;
        }
      }
      var id = target.name ? target.name : target.id;
      while (id != null) {
        var command = jQuery("[data-tobago-default='" + id + "']");
        if (command.size() > 0) {
          command.click();
          break;
        }
        id = Tobago.Utils.getNamingContainerId(id);
      }
      return false;
    }
  })};

Tobago.Command.initInputElements = function(elements) {
  var inputElements = Tobago.Utils.selectWithJQuery(elements, "input, select, textarea, a, button");
  inputElements.focus(function (event) {
    var target = event.target;
    var id = target.id;
    var command;
    if (target.tagName == "A" || target.tagName == "BUTTON") {
      command = jQuery(target);
    } else {
      while (id != null) {
        command = jQuery("[data-tobago-default='" + id + "']");
        if (command.size() > 0) {
          break;
        }
        id = Tobago.Utils.getNamingContainerId(id);
      }
    }
  });
  inputElements.blur(function (event) {
    var target = event.target;
    var id = target.id;
    var command;
    if (target.tagName == "A" || target.tagName == "BUTTON") {
      command = jQuery(target);
    } else {
      while (id != null) {
        command = jQuery("[data-tobago-default='" + id + "']");
        if (command.size() > 0) {
          break;
        }
        id = Tobago.Utils.getNamingContainerId(id);
      }
    }
  });
};

Tobago.registerListener(Tobago.Command.initEnter, Tobago.Phase.DOCUMENT_READY);

Tobago.registerListener(Tobago.Command.initInputElements, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.Command.initInputElements, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.SelectManyShuttle = {};

Tobago.SelectManyShuttle.init = function(elements) {

  var shuttles = Tobago.Utils.selectWithJQuery(elements, ".tobago-selectManyShuttle:not(.tobago-selectManyShuttle-disabled)");

  shuttles.find(".tobago-selectManyShuttle-unselected").dblclick(function() {
    Tobago.SelectManyShuttle.moveSelectedItems(jQuery(this).parents(".tobago-selectManyShuttle"), true, false);
  });

  shuttles.find(".tobago-selectManyShuttle-selected").dblclick(function() {
    Tobago.SelectManyShuttle.moveSelectedItems(jQuery(this).parents(".tobago-selectManyShuttle"), false, false);
  });

  shuttles.find(".tobago-selectManyShuttle-addAll").click(function() {
    Tobago.SelectManyShuttle.moveSelectedItems(jQuery(this).parents(".tobago-selectManyShuttle"), true, true);
  });

  shuttles.find(".tobago-selectManyShuttle-add").click(function() {
    Tobago.SelectManyShuttle.moveSelectedItems(jQuery(this).parents(".tobago-selectManyShuttle"), true, false);
  });

  shuttles.find(".tobago-selectManyShuttle-removeAll").click(function() {
    Tobago.SelectManyShuttle.moveSelectedItems(jQuery(this).parents(".tobago-selectManyShuttle"), false, true);
  });

  shuttles.find(".tobago-selectManyShuttle-remove").click(function() {
    Tobago.SelectManyShuttle.moveSelectedItems(jQuery(this).parents(".tobago-selectManyShuttle"), false, false);
  });
};

Tobago.SelectManyShuttle.moveSelectedItems = function(shuttle, direction, all) {
  var unselected = shuttle.find(".tobago-selectManyShuttle-unselected");
  var selected = shuttle.find(".tobago-selectManyShuttle-selected");
  var count = selected.children().size();
  var source = direction ? unselected : selected;
  var target = direction ? selected : unselected;
  var shifted = source.find(all ? "option:not(:disabled)" : "option:selected").remove().appendTo(target);

  // synchronize the hidden select
  var hidden = shuttle.find(".tobago-selectManyShuttle-hidden");
  var hiddenOptions = hidden.find("option");
  // todo: may be optimized: put values in a hash map?
  shifted.each(function() {
    var option = jQuery(this);
    hiddenOptions.filter("[value='" + option.val() + "']").prop("selected", direction);
  });

  if (count != selected.children().size()) {
    var e = jQuery.Event("change");
    // trigger an change event for command facets
    hidden.trigger( e );
  }
};

Tobago.registerListener(Tobago.SelectManyShuttle.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.SelectManyShuttle.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.SelectOneRadio = {};

Tobago.SelectOneRadio.init = function(elements) {
  var selectOneRadios = Tobago.Utils.selectWithJQuery(elements, ".tobago-selectOneRadio");
  selectOneRadios.each(function() {
    var ul = jQuery(this);
    var id = ul.closest("[id]").attr("id");
    var radios = jQuery('input[name="' + id.replace(/([:\.])/g, '\\$1') + '"]');
    radios.each(function () {
      var selectOneRadio = jQuery(this);
      selectOneRadio.data("tobago-old-value", selectOneRadio.prop("checked"));
    });
    radios.click(function() {
      var selectOneRadio = jQuery(this);
      var readonly = selectOneRadio.prop("readonly");
      var required = selectOneRadio.prop("required");
      if (!required && !readonly) {
        if (selectOneRadio.data("tobago-old-value") == selectOneRadio.prop("checked")) {
          selectOneRadio.prop("checked", false);
        }
        selectOneRadio.data("tobago-old-value", selectOneRadio.prop("checked"));
      }
      if (readonly) {
        radios.each(function () {
          var radio = jQuery(this);
          radio.prop("checked", radio.data("tobago-old-value"));
        });
      } else {
        radios.each(function () {
          if (this.id != selectOneRadio.get(0).id) {
            var radio = jQuery(this);
            radio.prop("checked", false);
            radio.data("tobago-old-value", radio.prop("checked"));
          }
        });
      }
    });
  });
};

Tobago.registerListener(Tobago.SelectOneRadio.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.SelectOneRadio.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.SelectOneListbox = {};

Tobago.SelectOneListbox.init = function (elements) {
  var selects = Tobago.Utils.selectWithJQuery(elements, ".tobago-selectOneListbox");
  var notRequired = selects.not(".tobago-selectOneListbox-markup-required");
  notRequired
      .change(function () {
        var element = jQuery(this);
        if (element.data("tobago-old-value") == undefined) {
          element.data("tobago-old-value", -1);
        }
      }).click(function () {
        var element = jQuery(this);
        if (element.data("tobago-old-value") == undefined
            || element.data("tobago-old-value") == element.prop("selectedIndex")) {
          element.prop("selectedIndex", -1);
        }
        element.data("tobago-old-value", element.prop("selectedIndex"));
      });
};

Tobago.registerListener(Tobago.SelectOneListbox.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.SelectOneListbox.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.SelectBooleanCheckbox = {};

Tobago.SelectBooleanCheckbox.init = function(elements) {
  var checkboxes = Tobago.Utils.selectWithJQuery(elements, ".tobago-selectBooleanCheckbox-markup-readonly input");
  checkboxes.each(function() {
    // Save the initial state to restore it, when the user tries to manipulate it.
    var initial = jQuery(this).is(":checked");
    jQuery(this).click(function() {
      jQuery(this).prop("checked", initial);
    });
  });
};

Tobago.registerListener(Tobago.SelectBooleanCheckbox.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.SelectBooleanCheckbox.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.SelectManyCheckbox = {};

Tobago.SelectManyCheckbox.init = function(elements) {
  var checkboxes = Tobago.Utils.selectWithJQuery(elements, ".tobago-selectManyCheckbox-markup-readonly input");
  checkboxes.each(function() {
    // Save the initial state to restore it, when the user tries to manipulate it.
    var initial = jQuery(this).is(":checked");
    jQuery(this).click(function() {
      jQuery(this).prop("checked", initial);
    });
  });
};

Tobago.registerListener(Tobago.SelectManyCheckbox.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.SelectManyCheckbox.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.File = {};

Tobago.File.init = function(elements) {
  var files = Tobago.Utils.selectWithJQuery(elements, ".tobago-file-real");
  files.change(function () {
    var file = jQuery(this);
    var pretty = file.parent().find(".tobago-file-pretty");
    var text;
    if (file.prop("multiple")) {
      var format = file.data("tobago-file-multi-format");
      text = format.replace("{}", file.prop("files").length);
    } else {
      text = file.val();
      // remove path, if any. Some old browsers set the path, others like webkit uses the prefix "C:\facepath\".
      var pos = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
      if (pos >= 0) {
        text = text.substr(pos + 1);
      }
    }
    pretty.val(text);
  });
  // click on the button (when using focus with keyboard)
  files.each(function() {
    var real = jQuery(this);
    real.parent().find("button").click(function() {
      real.click();
    });
  });
  if (files.length > 0) {
    Tobago.findForm().attr('enctype', 'multipart/form-data');
  }
};

Tobago.registerListener(Tobago.File.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.File.init, Tobago.Phase.AFTER_UPDATE);

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Tobago.Codi = {};

/**
 * If the window has no name set we set the name and request a new view with unset windowId, so that the
 * server will generate a new one for us.
 */
Tobago.Codi.init = function() {

  var form = Tobago.findForm();
  var action = form.attr("action");
  var windowIdEnabled = Tobago.Codi.hasUrlWindowId(action);
  if (windowIdEnabled && window.name == "") {
    form.attr("action", Tobago.Codi.urlWithoutWindowId(action));
    window.name = "window";
    Tobago.submitAction();
  }
};

Tobago.Codi.hasUrlWindowId = function(base) {
  return base.indexOf("?windowId=") > -1 || base.indexOf("&windowId=") > -1;
};

/**
 * taken from myfaces-extcdi (Codi)
 */
Tobago.Codi.urlWithoutWindowId = function(base) {
    var query = base;
    var vars = query.split(/&|\?/g);
    var newQuery = "";
    var iParam = 0;
    for (var i=0; vars != null && i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair.length == 1) {
            newQuery = pair[0];
        }
        else {
            if (pair[0] != "windowId") {
                var amp = iParam++ > 0 ? "&" : "?";
                newQuery =  newQuery + amp + pair[0] + "=" + pair[1];
            }
        }
    }
    return newQuery;
};

Tobago.registerListener(Tobago.Codi.init, Tobago.Phase.DOCUMENT_READY);

jsf.ajax.addOnEvent(function (event) {
  console.timeEnd("x"); // @DEV_ONLY
  console.time("x"); // @DEV_ONLY
  console.log(event);
  if (event.status == "success") {
    console.log("success");// @DEV_ONLY

    jQuery(event.responseXML).find("update").each(function () {
      var newElement = jQuery(Tobago.Utils.escapeClientId(jQuery(this).attr("id")));
      console.info("Update after jsf.ajax success: id='" + newElement.attr("id") + "'"); // @DEV_ONLY

      for (var order = 0; order < Tobago.listeners.afterUpdate.length; order++) {
        var list = Tobago.listeners.afterUpdate[order];
        for (var i = 0; i < list.length; i++) {
          list[i](newElement);
        }
      }
    });
  } else if (event.status == "complete") {
    console.log("complete");// @DEV_ONLY
    jQuery(event.responseXML).find("update").each(function () {
      var updateId = jQuery(this).attr("id");
      if ("javax.faces.ViewState" != updateId) {
        var oldElement = jQuery(Tobago.Utils.escapeClientId(updateId));
        console.info("Update after jsf.ajax complete: id='" + oldElement.attr("id") + "'"); // @DEV_ONLY
        if (oldElement.data("tobago-partial-overlay-set")) {
          oldElement.overlay("destroy")
        }
      }
    });
  }
});
