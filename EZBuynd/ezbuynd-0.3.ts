((globe) => {
    globe.EZB = (() => {

        var _logMissingProperty = (d: any, key: string): void => {
            console.log('Missing property ' + key + ' on object:', d);
        }
        /**
         * Binders that can be used to attach a value to an HTML element
         */
        var _binders = {

            /**
             * Sets the textContent or innerText property of an HTML element to the provided value
             * 
             * @param el The HTML elements
             * @param value The value to attach
             */
            text: (el: HTMLElement, value: any): void => {
                if (_.isUndefined(el.textContent)) {
                    el.innerText = value;
                }
                else {
                    el.textContent = value;
                }
            },

            /**
             * Sets the innerHTML property of an HTML element to the provided value.
             * 
             * @param el The HTML element
             * @param value The value to attache
             */
            html: (el: HTMLElement, value: any): void => {
                el.innerHTML = value;
            },

            /**
             * Sets the value attribute of an HTML element to the provided value.
             * 
             * @param el The HTML element
             * @param value The value to attach
             */
            value: (el: HTMLElement, value: any): void => {
                el.setAttribute('value', value);
            }
        }

        /**
         * Configurable string options that should be changed to avoid any conflicts.
         */
        var options = {

            /**
             * The prefix of binding attributes on HTML elements
             */
            attributePrefix: 'ezb-',

            /**
             * The string that seperates arguments in an attributes value.
             */
            valueArgSeperator: '|',

            /**
             * The string that indicates property chaining.
             */
            propertyBinder: '.',

            /**
             * The property key for the restore options.
             */
            restoreOptionsKey: '__ezbRestoreOptions',

            /**
             * The property key for the original set function of the object
             */
            rootSetFunctionName: '__setRoot',

            /**
             * The property key for the collection of watchers on an object.
             */
            watchersPropName: '__ezbWatchers',

            /**
             * The property key for the object template of an array.
             */
            arrayTemplates: '__ezbArrayTemplates',

            /**
             * The property key for the dependency of an array.
             */
            arrayDependency: '__ezbArrayDependency'
        }

        /**
         * Parses an HTML element and extracts any binding attributes from it
         * 
         * @param el The HTML element.
         */
        var _extractAttributes = (el: Element): IEzbuyndAttributes => {
            var attributes = el.attributes;
            var results = <IEzbuyndAttributes>{
                attributes: [],
                hasEach: false,
                hasIgnore: false,
                hasAny: false,
                isValidElement: false
            };

            if (_.isUndefined(attributes)) {
                return results;
            }

            results.isValidElement = true;

            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name.indexOf(options.attributePrefix) !== 0) {
                    continue;
                }

                var seperate = attributes[i].name.split('-');
                var type = seperate[1];
                var args = seperate.length > 2 ? seperate.slice(2) : [];

                var values = attributes[i].value.split(options.valueArgSeperator);
                var value = values[0];
                var arguments = values.length > 1 ? values.slice(1) : [];

                results.attributes.push(<IEzbuyndAttribute>{
                    fullname: attributes[i].name,
                    fullvalue: attributes[i].value,
                    attributeArgs: args,
                    value: value,
                    valueArgs: arguments,
                    type: type
                });

                if (type === 'ignore') {
                    results.hasIgnore = true;
                }
                else if (type === 'each') {
                    results.hasEach = true;
                }
            }

            if (results.attributes.length > 0) {
                results.hasAny = true;
            }

            return results;

        }

        /**
         * Returns the each binding from an attribute binding collection.
         * 
         * @param attrs A collection of binding attributes
         * 
         * @returns 
         */
        var _getEach = (attrs: IEzbuyndAttributes): IEzbuyndAttribute => {
            for (var i = 0; i < attrs.attributes.length; i++) {
                if (attrs.attributes[i].type === 'each') {
                    return attrs.attributes[i];
                }
            }
            return;
        }

        /**
         * Clones an element and all attributes except its ID. Optionally runs recursively to clone an entire piece of HTML.
         * 
         * @param el The HTML element to clone
         * @param deep An optional value indicating whether to run recursively, defaults to false.
         */
        var _cloneElement = (el: HTMLElement, deep?: boolean): HTMLElement => {
            var a = el.attributes;

            var clone = document.createElement(el.tagName);

            for (var i = 0; i < a.length; i++) {
                if (a[i].name === 'id') {
                    // Don't clone ID's.
                    continue;
                }
                else {
                    clone.setAttribute(a[i].name, a[i].value);
                }
            }

            if (deep) {
                for (var i = 0; i < el.children.length; i++) {
                    clone.appendChild(_cloneElement(<HTMLElement>el.children[i], true));
                }
            }

            return clone;
        }

        /**
         * Creates a new template object for this HTML element and all child elements
         * 
         * @param el The HTML element
         */
        var _createTemplate = (el: HTMLElement): ITemplate => {
            var template = <ITemplate>{
                sourceElement: el,
                childTemplates: [],
                baseElement: null,
                valueBindings: [],
                dependencyKey: null,
            };

            var baseElement = _cloneElement(el, true);

            for (var i = 0; i < baseElement.children.length; i++) {
                var attr = _extractAttributes(baseElement.children[i]);
                if (attr.hasIgnore) {
                    continue;
                }
                else if (attr.hasEach) {
                    var cTpl = _createTemplate(<HTMLElement>baseElement.children[i]);
                    cTpl.parentTemplate = template;
                    template.childTemplates.push(cTpl);
                    baseElement.removeChild(baseElement.children[i]);
                    i--;
                }
                else {
                    var cTpl = _createTemplate(<HTMLElement>baseElement.children[i]);
                    cTpl.parentTemplate = template;
                    template.childTemplates.push(cTpl);
                }
            }

            template.appendNew = (el: HTMLElement) => {
                var p = template.parentTemplate;
                if (_.isUndefined(p)) {
                    _logMissingProperty(p, 'parentTemplate');
                    throw 'No parent template was found.';
                }

                if (p.childTemplates.length > 1) {
                    var idx = -1;
                    for (var i = 0; i < p.childTemplates.length; i++) {
                        if (template === p.childTemplates[i]) {
                            idx = i;
                            break;
                        }
                    }

                    if (i === p.childTemplates.length - 1) {
                        template.parentEl.appendChild(el);
                    }
                    else {
                        var nextTpl = p.childTemplates[idx + 1];
                        var nextEl = nextTpl.el;
                        if (!_.isUndefined(nextEl)) {
                            template.parentEl.insertBefore(el, nextEl);
                        }
                    }
                }
                else {
                    template.parentEl.appendChild(el);
                }
            }

            template.baseElement = baseElement;

            return template;
        }

        /**
         * Searches through the dependency hierarchy of the root key to find the specified key
         * 
         * @param root The root dependency key
         * @param key The name of the dependency key to search for.
         */
        var _findDependantKey = (root: IDependencyKey, key: string): IDependencyKey => {
            if (root.key === key) {
                return root;
            }
            for (var i = 0; i < root.subkeys.length; i++) {
                if (root.subkeys[i].key === key) {
                    return root.subkeys[i];
                }
                else {
                    var subkey = _findDependantKey(root.subkeys[i], key);
                    if (!_.isUndefined(subkey)) {
                        return subkey;
                    }
                }
            }
            return;
        }

        /**
         * Creates all of the value bindings and dependency bindings for the provided template.
         * 
         * @param dependentKey A key to a collection that this template depends on
         * @param binding The current template to create data bindings for.
         */
        var _createDataBindings = (dependentKey: IDependencyKey, binding: ITemplate): ITemplate => {
            var attributes = _extractAttributes(binding.baseElement);

            if (attributes.hasIgnore) {
                return binding;
            }
            else if (attributes.hasEach) {
                var eachKey = _getEach(attributes);
                var keyParts = eachKey.value.split(options.propertyBinder);
                if (keyParts.length === 1 || _.isNull(dependentKey)) {
                    binding.dependencyKey = {
                        rootKey: undefined,
                        parent: undefined,
                        key: eachKey.attributeArgs[0],
                        value: eachKey.value,
                        subkeys: []
                    };
                }
                else {
                    var root = dependentKey.rootKey || dependentKey;
                    var key = _findDependantKey(root, keyParts[0]);

                    if (!_.isUndefined(key)) {
                        var dKey = <IDependencyKey>{
                            parent: key,
                            rootKey: root,
                            subkeys: [],
                            value: keyParts.slice(1).join(options.propertyBinder),
                            key: eachKey.attributeArgs[0]
                        };

                        key.subkeys.push(dKey);
                        binding.dependencyKey = dKey;
                    }
                    else {
                        var dKey = <IDependencyKey>{
                            rootKey: undefined,
                            parent: undefined,
                            key: eachKey.attributeArgs[0],
                            value: eachKey.value,
                            subkeys: []
                        };

                        binding.dependencyKey = dKey;
                    }
                }
            }

            var rootkey;
            if (!_.isNull(binding.dependencyKey)) {
                rootkey = binding.dependencyKey.rootKey || binding.dependencyKey;
            }
            else if (!_.isNull(dependentKey)) {
                rootkey = dependentKey.rootKey || dependentKey || null;
            }

            for (var i = 0; i < attributes.attributes.length; i++) {
                var a = attributes.attributes[i];
                if (a.type === 'each' || a.type === 'ignore') {
                    continue;
                }
                else {
                    var vkey = <IValueKey>{
                        type: a.type,
                        dependency: null,
                        value: a.value,
                    };

                    for (var i = 0; i < a.valueArgs.length; i++) {
                        if (a.valueArgs[i] === 'nowatch') {
                            vkey.nowatch = true;
                        }
                        else if (a.valueArgs[i] === 'logchange') {
                            vkey.logchange = true;
                        }
                    }

                    var keyparts = a.value.split(options.propertyBinder);
                    if (keyparts.length > 1) {
                        if (!_.isUndefined(rootkey)) {
                            var dep = _findDependantKey(rootkey, keyparts[0]);
                            if (!_.isUndefined(dep)) {
                                vkey.value = keyparts.slice(1).join(options.propertyBinder);
                                vkey.dependency = dep;
                            }
                        }
                    }

                    binding.valueBindings.push(vkey);
                }
            }

            for (var i = 0; i < binding.childTemplates.length; i++) {
                binding.childTemplates[i] = _createDataBindings(rootkey || null, binding.childTemplates[i]);
            }

            return binding;
        }

        /**
         * Returns the nested property of an object specified by the provided key.
         * 
         * @param data The object to retrieve the property from
         * @param keyValue The key value that indicates the nested property to retrieve.
         */
        var _getDataProperty = (data: any, keyValue: string): any => {
            var valueParts = keyValue.split(options.propertyBinder);
            var d = data;
            for (var i = 0; i < valueParts.length; i++) {
                if (_.isUndefined(d)) {
                    console.log('Missing property', d);
                    throw 'The property "' + valueParts[i] + '" does not exist on object';
                }
                else {
                    d = _agnosticGet(d, valueParts[i]);
                }
            }
            return d;
        }

        /**
         * Searches the binding data collection for the key provided.
         * 
         * @param bdata The current binding data state.
         * @param key The key that indicates which piece of data to retrieve.
         */
        var _findBindingData = (bdata: IBindingData, key: string): any => {
            var data = bdata.keys[key];

            if (_.isUndefined(data)) {
                console.log(bdata);
                throw 'No data key could be found in the binding source for [' + key + ']';
            }

            return data;
        }

        /**
         * Returns the direct property of an object, either by using the get method or by accessing it directly.
         * 
         * @param data The object to retrieve the property from.
         * @param key The key string indicating the property to retrieve.
         */
        var _agnosticGet = (data: any, key: string): any => {
            if (_.isUndefined(data.get)) {
                return data[key];
            }
            else {
                return data.get(key);
            }
        }

        /**
         * Creates an observer function on a data object for a specific property and root binding.
         * 
         * @param key The key of the property that the observer should be created for
         * @param valueBinding The binding of the property on the HTML element
         * @param data The data object that the binding retrieves data from.
         * @param el The HTML element that the binding is applied to
         * @param binding The root EZBuynd binding.
         */
        var _createObserver = (key: string, valueBinding: IValueKey, data: any, el: HTMLElement, binding: IBinding): void => {
            var valueParts = key.split(options.propertyBinder);

            if (valueParts.length > 1) {
                for (var i = 0; i < valueParts.length - 1; i++) {
                    data = _agnosticGet(data, valueParts[i]);
                }
            }
            var k = valueParts[valueParts.length - 1];
            var watchFn;
            if (!valueBinding.logchange) {
                watchFn = () => {
                    _binders[valueBinding.type](el, data.get(key));
                }
            }
            else {
                watchFn = () => {
                    var val = _agnosticGet(data, key);
                    console.log('Object changed', data);
                    console.log('Value of "' + k + '" has been changed to: ', val);
                    _binders[valueBinding.type](el, val);
                }
            }

            var exists = false;

            if (_.isUndefined(data[options.watchersPropName])) {
                data[options.watchersPropName] = [];
            }

            for (var i = 0; i < data[options.watchersPropName].length; i++) {
                if (k === data[options.watchersPropName][i].key && data[options.watchersPropName][i].binding == binding) {
                    exists = true;
                    data[options.watchersPropName][i].watchers.push(watchFn);
                    break;
                }
            }

            if (!exists) {
                var watcher = <IKeyWatcher>{
                    key: k,
                    watchers: [watchFn],
                    binding: binding
                };

                data[options.watchersPropName].push(watcher);
            }

            if (_.isUndefined(data[options.restoreOptionsKey])) {
                _createObjectRestoreOptions(data);
            }
            if (_.isUndefined(data[options.rootSetFunctionName])) {
                if (!(<IRestoreOptions>data[options.restoreOptionsKey]).objectOptions.hasSetter) {
                    data[options.rootSetFunctionName] = ((self: any) => {
                         return (key: string, value: any): void => { self[key] = value; }
                    })(data);
                }
                else {
                    data[options.rootSetFunctionName] = data.set;
                }

                data.set = ((self: any) => {
                    return (key: string, value: any): void => {
                        self[options.rootSetFunctionName](key, value);
                        var w;
                        for (var i = 0; i < self[options.watchersPropName].length; i++) {
                            if (key === self[options.watchersPropName][i].key) {
                                w = self[options.watchersPropName][i].watchers;
                                for (var j = 0; j < w.length; j++) {
                                    w[j]();
                                }
                            }
                        }
                    }
                })(data);
            }

            if (!(<IRestoreOptions>data[options.restoreOptionsKey]).objectOptions.hasGetter) {
                data.get = ((self: any) => {
                    return (key: string) => { return self[key]; }
                })(data);
            }
        }

        var _createDependencyTemplate = (template: ITemplate, data: any[], binding: IBinding): IArrayTemplate => {

            var t = <IArrayTemplate>{
                binding: binding,
                template: template
            };

            if (_.isUndefined(data[options.arrayTemplates])) {
                data[options.arrayTemplates] = [t];
            }
            else {
                data[options.arrayTemplates].push(t);
            }

            return t;
        }

        var _createArrayRestoreOptions = (datasource: any[], binding: IBinding) => {
            if (!_.isUndefined(datasource[options.restoreOptionsKey])) {
                return;
            }

            var ro = <IRestoreOptions>{
                isArray: true,
                arrayOptions: <IArrayRestoreOptions>{
                    push: datasource.push,
                    pop: datasource.pop,
                    reverse: datasource.reverse,
                    shift: datasource.shift,
                    sort: datasource.sort,
                    splice: datasource.splice,
                    unshift: datasource.unshift
                }
            };

            datasource[options.restoreOptionsKey] = ro;

            datasource.push = (...elements: any[]): number => {
                if (elements.length === 0) {
                    return datasource.length;
                }
                else {
                    var result = (<IRestoreOptions>datasource[options.restoreOptionsKey]).arrayOptions.push.apply(datasource, elements);

                    for (var i = 0; i < datasource[options.arrayTemplates].length; i++) {
                        var t = <IArrayTemplate>datasource[options.arrayTemplates][i];

                        for (var j = 0; j < elements.length; j++) {
                            var el = t.creator(elements[j]);
                            t.template.appendNew(el);
                        }
                    }

                    return result;
                }
            };

        }

        /**
         * Unbinds the previous data source, rebinds the new data source of the root EZBuynd binding, regenerates
         * all bindings, and regenerates all HTML replacing the current HTML in the document if it exists.
         * 
         * @param datasource The new root datasource for this EZBuynd binding
         * @param originalElement The original HTML element with its binding attributes intact.
         * @param binding The root EZBuynd binding
         */
        var _setDataSource = (datasource: any, originalElement: HTMLElement, binding: IBinding) => {
            binding.datasource = datasource;

            var currentElement = binding.els;

            var root = binding.rootTemplate;
            var el = _cloneElement(root.baseElement, false);

            if (binding.rootTemplate.sourceElement.hasAttribute('id')) {
                el.setAttribute('id', binding.rootTemplate.sourceElement.getAttribute('id'));
            }

            for (var i = 0; i < root.valueBindings.length; i++) {
                var d = _getDataProperty(binding.datasource, root.valueBindings[i].value);
                _binders[root.valueBindings[i].type](el, d);
            }

            var bData = <IBindingData>{
                keys: {},
                root: datasource
            };

            // Creates child bindings for an object.
            var childBindings = (parent: ITemplate, parentElement: HTMLElement, bindingData: IBindingData): HTMLElement[]=> {
                var els = [];

                var children = parent.childTemplates;
                for (var i = 0; i < children.length; i++) {
                    if (!_.isNull(children[i].dependencyKey)) {
                        var dkey = children[i].dependencyKey;
                        var d;
                        if (_.isUndefined(dkey.parent)) {
                            d = _getDataProperty(bindingData.root, dkey.value);
                        }
                        else {
                            d = _getDataProperty(_findBindingData(bindingData, dkey.parent.key), dkey.value);
                        }
                        if (_.isUndefined(d)) {
                            console.log(bindingData, children[i]);
                            continue;
                        }

                        _createArrayRestoreOptions(d, binding);

                        var dt = _createDependencyTemplate(children[i], d, binding);
                        var template = dt.template;

                        dt.creator = (newData: any): HTMLElement => {
                            bindingData.keys[dkey.key] = newData;
                            var childRoot = _cloneElement(template.baseElement, false);
                            childRoot.removeAttribute(options.attributePrefix + 'each-' + dkey.key);
                            var templateChildren = childBindings(template, childRoot, bindingData);
                            for (var k = 0; k < templateChildren.length; k++) {
                                childRoot.appendChild(templateChildren[k]);
                            }

                            for (var k = 0; k < template.valueBindings.length; k++) {
                                var vbinding = <IValueKey>template.valueBindings[k];
                                if (_.isNull(vbinding.dependency)) {
                                    var childData = _getDataProperty(bindingData.root, vbinding.value);
                                    if (!vbinding.nowatch) {
                                        _createObserver(vbinding.value, vbinding, bindingData.root, childRoot, binding);
                                    }
                                }
                                else {
                                    var childData = _getDataProperty(_findBindingData(bindingData, vbinding.dependency.key), vbinding.value);
                                    if (!vbinding.nowatch) {
                                        _createObserver(vbinding.value, vbinding, bindingData.root, childRoot, binding);
                                    }
                                }

                                _binders[vbinding.type](childRoot, childData);
                                childRoot.removeAttribute(options.attributePrefix + vbinding.type);
                            }

                            template.parentEl = parentElement;

                            return childRoot;
                        };

                        for (var j = 0; j < d.length; j++) {
                            var el = dt.creator(d[j]);
                            els.push(el);
                        }
                    }
                    else {
                        var innerEl = _cloneElement(children[i].baseElement, false);
                        for (var j = 0; j < children[i].valueBindings.length; j++) {
                            var vbinding = children[i].valueBindings[j];
                            if (_.isNull(vbinding.dependency)) {
                                var d = _getDataProperty(bindingData.root, vbinding.value);
                                if (!vbinding.nowatch) {
                                    _createObserver(vbinding.value, vbinding, bindingData.root, innerEl, binding);
                                }
                            }
                            else {
                                var valueData = _findBindingData(bindingData, vbinding.dependency.key);
                                var d = _getDataProperty(valueData, vbinding.value);
                                if (!vbinding.nowatch) {
                                    _createObserver(vbinding.value, vbinding, valueData, innerEl, binding);
                                }
                            }

                            _binders[vbinding.type](innerEl, d);
                            innerEl.removeAttribute(options.attributePrefix + vbinding.type);
                        }

                        var templateChildren = childBindings(children[i], innerEl, bindingData);
                        for (var j = 0; j < templateChildren.length; j++) {
                            innerEl.appendChild(templateChildren[j]);
                        }

                        children[i].el = innerEl;

                        els.push(innerEl);
                    }
                }

                return els;
            }

            var children = childBindings(root, el, bData);

            for (var i = 0; i < children.length; i++) {
                el.appendChild(children[i]);
            }

            binding.els = el;

            if (document.body.contains(originalElement)) {
                originalElement.parentNode.replaceChild(binding.els, originalElement);
            }
            else if (document.body.contains(currentElement)) {
                currentElement.parentNode.replaceChild(binding.els, currentElement);
            }
        }

        /**
         * Unbinds the current data source from the root EZBuynd binding. The datasource object will be 
         * returned to its attribute maps original state, pre-binding. If properties have been changed
         * while the data object was bound their values will not be reverted.
         * 
         * @param datasource The data object to unbind and revert to its original state.
         * @param unbound A collection of objects that have already passed through the unbind method
         * @param binding The root EZBuynd binding
         */
        var _unbindDataSource = (datasource: any, unbound: any[], binding: IBinding) => {
            if (!_.isUndefined(datasource)) {
                if (!_.isUndefined(datasource[options.watchersPropName])) {
                    for (var i = 0; i < datasource[options.watchersPropName].length; i++) {
                        var w = datasource[options.watchersPropName][i];
                        if (w.binding == binding) {
                            datasource[options.watchersPropName].splice(i, 1);
                            i--;
                        }
                    }

                    if (datasource[options.watchersPropName].length === 0) {
                        delete datasource[options.watchersPropName];
                    }
                }

                var ro = (<IRestoreOptions>datasource[options.restoreOptionsKey]);

                // If the object doesn't have restore options it means it was never bound, so don't run this
                // If the datasource still contains watchers then it is bound to another EZBuynd binding, so don't run this.
                if (!_.isUndefined(ro) && _.isUndefined(datasource[options.watchersPropName])) {
                    if (ro.objectOptions.hasSetter) {
                        datasource.set == datasource[options.rootSetFunctionName];
                    }
                    else {
                        delete datasource.set;
                    }

                    if (!ro.objectOptions.hasGetter) {
                        delete datasource.get;
                    }

                    delete datasource[options.rootSetFunctionName];
                    delete datasource[options.restoreOptionsKey];
                }

                /**
                 * Exclusions from the properties to unbind, these should all be deleted anyway.
                 */
                var exclude = [
                    options.restoreOptionsKey,
                    options.rootSetFunctionName,
                    options.watchersPropName,
                    'set',
                    'get'
                ];

                for (var prop in datasource) {
                    var isExcluded = false;
                    for (var q = 0; q < exclude.length; q++) {
                        if (exclude[q] === prop) {
                            isExcluded = true;
                            break;
                        }
                    }

                    if (isExcluded) {
                        // The property found is one in the excluded list.
                        continue;
                    }

                    // If the property belongs to the instance or instance class.
                    if (Object.prototype.hasOwnProperty.call(datasource, prop)) {
                        // If not an array or an object go to next property.
                        if (_.isFunction(datasource[prop]) ||
                            !_.isObject(datasource[prop]) ||
                            _.isNull(datasource[prop]) ||
                            _.isUndefined(datasource[prop])) {
                            continue;
                        }
                        if (!_.isNull(unbound)) {
                            // Array of already unbound objects should prevent circular recursion.
                            var completed = false;
                            for (var j = 0; j < unbound.length; j++) {
                                if (unbound[j] == datasource[prop]) {
                                    completed = true;
                                    break;
                                }
                            }

                            if (completed) {
                                // A circular reference is detected, move to next property.
                                continue;
                            }
                            unbound.push(datasource);
                        }
                        else {
                            unbound = [datasource];
                        }

                        // If the property is an array, add the array as a whole to the completed object list
                        // to prevent circular recursion, then unbind each individual object in the array.
                        if (_.isArray(datasource[prop])) {

                            datasource.

                            unbound.push(datasource[prop]);
                            for (var j = 0; j < datasource[prop].length; j++) {
                                _unbindDataSource(datasource[prop][j], unbound, binding);
                            }
                        }
                        else {
                            _unbindDataSource(datasource[prop], unbound, binding);
                        }
                    }
                }
            }
        }

        /**
         * Creates settings to use for unbinding the object at a later point in time.
         * 
         * @param datasource The object to create restore settings for
         * @param binding The root EZBuynd binding
         */
        var _createObjectRestoreOptions = (datasource: any) => {
            if (_.isUndefined(<IRestoreOptions>datasource[options.restoreOptionsKey])) {
                datasource[options.restoreOptionsKey] = <IRestoreOptions>{
                    isArray: false,
                    objectOptions: {
                        hasSetter: !_.isUndefined(datasource.set),
                        hasGetter: !_.isUndefined(datasource.get)
                    }
                };
            }
        }

        /**
         * Binds the data provided to the HTML element and returns an EZBuynd binding.
         * 
         * @param originalElement The HTMLElement to bind to
         * @param data The datasource to bind
         */
        var bind = (originalElement: HTMLElement, data: any): IBinding => {
            var binding = <IBinding>{
                _backup: originalElement,
                rootTemplate: _createTemplate(originalElement),
            };

            _createObjectRestoreOptions(data);

            binding.rootTemplate = _createDataBindings(binding.rootTemplate.dependencyKey, binding.rootTemplate);

            binding.setDataSource = ((b: IBinding, o: HTMLElement) => {
                return (datasource: any) => {
                    _unbindDataSource(b.datasource, null, b);
                    _setDataSource(datasource, o, b)
                }
            })(binding, originalElement);

            binding.setDataSource(data);

            binding.unbind = ((b: IBinding) => {
                return (command?: string) => {
                    _unbindDataSource(b.datasource, null, b);
                    if (!_.isUndefined(command)) {
                        if (command === 'remove') {
                            b.els.parentNode.removeChild(b.els);
                        }
                        else if (command === 'reset') {
                            b.els.parentNode.replaceChild(b._backup, b.els);
                        }
                    }
                }
            })(binding);

            return binding;
        }

        return {
            options: options,
            bind: bind,
            binders: _binders
        }
    })();
})(this); 