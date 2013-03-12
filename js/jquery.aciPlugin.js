
/*
 * aciPlugin little jQuery plugin helper v1.0.0
 * http://acoderinsights.ro
 *
 * Copyright (c) 2013 Dragos Ursu
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Require jQuery Library >= v1.2.3 http://jquery.com
 *
 * Date: Sun Mar 10 18:50 2013 +0200
 */

/*
 * This is not a jQuery plugin but a helper to help you create extendable
 * jQuery plugins. It provide the means to access instance data (with the
 * '_instance' property), you can access the parent overridden function
 * with '_super' and any other parent functions with '_parent'.
 * The object is keept on the element with .data and there exists functionality
 * to get/set default options and getting access to plugin API.
 *
 * A little explanation about how to use this ...
 *
 * To create your plugin, extend the base aciPluginClass.aciPluginUi class like:
 *      aciPluginClass.plugins.[yourPluginName] = aciPluginClass.aciPluginUi.extend([yourPluginObject]);
 * where 'yourPluginName' is the plugin name and 'yourPluginObject' is the plugin object.
 *
 * Publish the plugin (and the default options) with:
 *      aciPluginClass.publish('yourPluginName', [defaultOptionsObject]);
 * where 'yourPluginName' is the plugin name (same as from aciPluginClass.plugins.yourPluginName)
 * and 'defaultOptionsObject' is the default options object (will be available as $.fn.[yourPluginName].defaults).
 *
 * Extend a plugin like:
 *      aciPluginClass.plugins.[yourPluginName] = aciPluginClass.[yourPluginName].extend([yourPluginExtensionObject]);
 * where 'yourPluginName' is the plugin name and the 'yourPluginExtensionObject' is the extension object.
 *
 * Extend the default options (add more options) with:
 *      aciPluginClass.defaults('[yourPluginName]', [extraOptionsObject]);
 * where 'yourPluginName' is the plugin name (same as the extended one)
 * and 'extraOptionsObject' is the extra options object to be added (to be available as $.fn.[yourPluginName].defaults).
 *
 * Access the current jQuery element with:
 *      this._instance.jQuery
 *
 * Use the namespace (same as the plugin name with a dot in front):
 *      this._instance.jQuery.bind('click' + this._instance.nameSpace, [function]);
 *
 * Read the options:
 *      var option = this._instance.options.[option];
 * or use the 'options' function:
 *      var option = this.options('[option]');
 *
 * How to call the super/parent functions:
 *      this._super([argument1], [argument2], ... );
 *      this._parent.[function].apply(this, arguments);
 *      this._parent.[function].call(this, [argument1], [argument2], ... );
 *
 * Check the website pages for a quick plugin sample ;)
 */

(function($){

    // include only once
    if (typeof aciPluginClass != 'undefined'){
        return;
    }

    var construct;

    this.aciPluginClass = function(){};

    // a basic extendable class
    aciPluginClass.extend = function(properties){
        aciPluginClass.extend = arguments.callee;
        function aciPluginClass() {
            if (construct){
                // instance data
                this._instance = {};
                return this.__construct.apply(this, arguments);
            }
        }
        construct = false;
        aciPluginClass.prototype = new this();
        construct = true;
        var parent = this.prototype;
        for (var name in properties){
            // extend with the new object
            aciPluginClass.prototype[name] = (typeof properties[name] == 'function') && (typeof parent[name] == 'function') ?
            (function(name, callable){
                return function() {
                    // super access
                    this._super = parent[name];
                    return callable.apply(this, arguments);
                };
            })(name, properties[name]) : properties[name];
        }
        // parent access
        aciPluginClass.prototype._parent = parent;
        return aciPluginClass;
    };

    // the plugin core
    aciPluginClass.aciPluginUi = aciPluginClass.extend({
        __construct: function(pluginName, jQuery, settings, option, value){
            // basic initialization
            var nameSpace = '.' + pluginName;
            var object = jQuery.data(nameSpace);
            if (object){
                // object already constructed, use the old one
                this._instance = object._instance;
                return object.__request(settings, option, value);
            }
            // save this into element's data for later reference
            jQuery.data(nameSpace, this);
            // note: names defined here are reserved, also check the plugin '__extend' definition before you extend a plugin
            $.extend(this._instance, {
                nameSpace: nameSpace,
                jQuery: jQuery,
                options: $.extend({}, $.fn[pluginName].defaults, (typeof settings == 'object') ? settings : {}),
                wasInit: false
            });
            // extend instance data (to keep states for example)
            this.__extend();
            return this.__request(settings, option, value);
        },
        __extend: function(){
        // override this to add extra instance data on construct, like:
        // $.extend(this._instance, {
        //        option1: [value],
        //        option2: [value]
        //    });
        },
        __request: function(settings, option, value){
            // process custom request
            if ((typeof settings == 'undefined') || (typeof settings == 'object')){
                // gets here on a call like: $(element).thePlugin(); or $(element).thePlugin([options]);
                if (this._instance.options.autoInit){
                    this.init();
                }
            } else if (typeof settings == 'string'){
                switch (settings){
                    case 'init':
                        // init the UI
                        // gets here on a call like: $(element).thePlugin('init');
                        this.init();
                        break;
                    case 'api':
                        // get the API entry point
                        // gets here on a call like: $(element).thePlugin('api').[function](argument1, ... );
                        return {
                            object: this
                        };
                    case 'options':
                        // get one or all options, set one or more options
                        if (typeof option == 'undefined'){
                            // get all options
                            // gets here on a call like: $(element).thePlugin('options');
                            return {
                                object: this.options()
                            };
                        } else if (typeof option == 'string'){
                            // get one option
                            // gets here on a call like: $(element).thePlugin('options', '[option]');
                            return {
                                object: this.options(option)
                            };
                        } else {
                            // set one or more options
                            // gets here on a call like: $(element).thePlugin('options', { [option1]: [value], [option2]: [value], ... });
                            this.options(option);
                        }
                        break;
                    case 'option':
                        // set one option
                        // gets here on a call like: $(element).thePlugin('option', '[option]', [value]);
                        this.option(option, value);
                        break;
                    case 'destroy':
                        // destroy the UI
                        // gets here on a call like: $(element).thePlugin('destroy');
                        this.destroy();
                        break;
                }
            }
            return this._instance.jQuery;
        },
        init: function(){
            // init UI
            if (!this._instance.wasInit){
                this._instance.wasInit = true;
                return true;
            }
            return false;
        },
        wasInit: function(){
            // get init state
            return this._instance.wasInit;
        },
        options: function(options){
            if (options){
                if (typeof options == 'string'){
                    // get one option
                    return this._instance.options[options];
                } else {
                    // set more options
                    for(var option in options){
                        this.option(option, options[option]);
                    }
                }
            } else {
                // get all options
                return this._instance.options;
            }
        },
        option: function(option, value){
            // set one option
            this._instance.options[option] = value;
        },
        destroy: function(){
            // destroy UI
            if (this._instance.wasInit){
                this._instance.wasInit = false;
                // remove this object from element's data
                this._instance.jQuery.removeData(this._instance.nameSpace);
                return true;
            }
            return false;
        }
    });

    // keep the plugins here
    aciPluginClass.plugins = {};

    // publish our plugin so we can use it
    aciPluginClass.publish = function(pluginName, defaults){
        // add our plugin
        $.fn[pluginName] = function(options, option, value){
            var result = null;
            for(var i = 0, size = this.length; i < size; i++){
                result = new aciPluginClass.plugins[pluginName](pluginName, $(this[i]), options, option, value);
                if (!(result instanceof jQuery)){
                    return result.object;
                }
            }
            return this;
        };
        // set the defaults
        $.fn[pluginName].defaults = $.extend({
            autoInit: true
        }, (typeof defaults == 'object') ? defaults : {});
    };

    // extend the default options
    aciPluginClass.defaults = function(pluginName, extend){
        $.extend($.fn[pluginName].defaults, (typeof extend == 'object') ? extend : {});
    };

})(jQuery);
