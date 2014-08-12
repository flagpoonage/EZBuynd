(function (globe) {
    globe.EZB = (function () {
        var _binders = {
            text: function (el, value) {
                if (_.isUndefined(el.textContent)) {
                    el.innerText = value;
                } else {
                    el.textContent = value;
                }
            },
            html: function (el, value) {
                el.innerHTML = value;
            },
            value: function (el, value) {
                el.setAttribute('value', value);
            }
        };

        var options = {
            attributePrefix: 'ezb-',
            valueArgSeperator: '|',
            propertyBinder: '.',
            restoreOptionsKey: '__ezbRestoreOptions',
            rootSetFunctionName: '__setRoot',
            watchersPropName: '__ezbWatchers'
        };

        var _extractAttributes = function (el) {
            var attributes = el.attributes;

            var results = {
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

                results.attributes.push({
                    fullname: attributes[i].name,
                    fullvalue: attributes[i].value,
                    attributeArgs: args,
                    value: value,
                    valueArgs: arguments,
                    type: type
                });

                if (type === 'ignore') {
                    results.hasIgnore = true;
                } else if (type === 'each') {
                    results.hasEach = true;
                }
            }

            if (results.attributes.length > 0) {
                results.hasAny = true;
            }

            return results;
        };

        var _getEach = function (attrs) {
            for (var i = 0; i < attrs.attributes.length; i++) {
                if (attrs.attributes[i].type === 'each') {
                    return attrs.attributes[i];
                }
            }
            return;
        };

        var _cloneElement = function (el, deep) {
            var a = el.attributes;

            var clone = document.createElement(el.tagName);

            for (var i = 0; i < a.length; i++) {
                if (a[i].name === 'id') {
                    continue;
                } else {
                    clone.setAttribute(a[i].name, a[i].value);
                }
            }

            if (deep) {
                for (var i = 0; i < el.children.length; i++) {
                    clone.appendChild(_cloneElement(el.children[i], true));
                }
            }

            return clone;
        };

        var _createTemplate = function (el) {
            var template = {
                sourceElement: el,
                childTemplates: [],
                baseElement: null,
                valueBindings: [],
                dependencyKey: null
            };

            var baseElement = _cloneElement(el, true);

            for (var i = 0; i < el.children.length; i++) {
                var attr = _extractAttributes(baseElement.children[i]);
                if (attr.hasIgnore) {
                    continue;
                } else if (attr.hasEach) {
                    template.childTemplates.push(_createTemplate(baseElement.children[i]));
                    baseElement.removeChild(baseElement.children[i]);
                } else {
                    template.childTemplates.push(_createTemplate(baseElement.children[i]));
                }
            }

            template.baseElement = baseElement;

            return template;
        };

        var _findDependantKey = function (root, key) {
            if (root.key === key) {
                return root;
            }
            for (var i = 0; i < root.subkeys.length; i++) {
                if (root.subkeys[i].key === key) {
                    return root.subkeys[i];
                } else {
                    var subkey = _findDependantKey(root.subkeys[i], key);
                    if (!_.isUndefined(subkey)) {
                        return subkey;
                    }
                }
            }
            return;
        };

        var _createDataBindings = function (dependentKey, binding) {
            var attributes = _extractAttributes(binding.baseElement);

            if (attributes.hasIgnore) {
                return binding;
            } else if (attributes.hasEach) {
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
                } else {
                    var root = dependentKey.rootKey || dependentKey;
                    var key = _findDependantKey(root, keyParts[0]);

                    if (!_.isUndefined(key)) {
                        var dKey = {
                            parent: key,
                            rootKey: root,
                            subkeys: [],
                            value: keyParts.slice(1).join(options.propertyBinder),
                            key: eachKey.attributeArgs[0]
                        };

                        key.subkeys.push(dKey);
                        binding.dependencyKey = dKey;
                    } else {
                        var dKey = {
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
            } else if (!_.isNull(dependentKey)) {
                rootkey = dependentKey.rootKey || dependentKey || null;
            }

            for (var i = 0; i < attributes.attributes.length; i++) {
                var a = attributes.attributes[i];
                if (a.type === 'each' || a.type === 'ignore') {
                    continue;
                } else {
                    var vkey = {
                        type: a.type,
                        dependency: null,
                        value: a.value
                    };

                    for (var i = 0; i < a.valueArgs.length; i++) {
                        if (a.valueArgs[i] === 'nowatch') {
                            vkey.nowatch = true;
                        } else if (a.valueArgs[i] === 'logchange') {
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
        };

        var _getDataProperty = function (data, keyValue) {
            var valueParts = keyValue.split(options.propertyBinder);
            var d = data;
            for (var i = 0; i < valueParts.length; i++) {
                if (_.isUndefined(d.get)) {
                    d = d[valueParts[i]];
                } else {
                    d = d.get(valueParts[i]);
                }
            }
            return d;
        };

        var _findBindingData = function (bdata, key) {
            var data = bdata.keys[key];

            if (_.isUndefined(data)) {
                console.log(bdata);
                throw 'No data key could be found in the binding source for [' + key + ']';
            }

            return data;
        };

        var _agnosticGet = function (data, key) {
            if (_.isUndefined(data.get)) {
                return data[key];
            } else {
                return data.get(key);
            }
        };

        var _createObserver = function (key, valueBinding, data, el, binding) {
            var valueParts = key.split(options.propertyBinder);

            if (valueParts.length > 1) {
                for (var i = 0; i < valueParts.length - 1; i++) {
                    data = _agnosticGet(data, valueParts[i]);
                }
            }
            var k = valueParts[valueParts.length - 1];
            var watchFn;
            if (!valueBinding.logchange) {
                watchFn = function () {
                    _binders[valueBinding.type](el, data.get(key));
                };
            } else {
                watchFn = function () {
                    var val = _agnosticGet(data, key);
                    console.log('Object changed', data);
                    console.log('Value of "' + k + '" has been changed to: ', val);
                    _binders[valueBinding.type](el, val);
                };
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
                var watcher = {
                    key: k,
                    watchers: [watchFn],
                    binding: binding
                };

                data[options.watchersPropName].push(watcher);
            }

            if (_.isUndefined(data[options.restoreOptionsKey])) {
                _createRestoreOptions(data, binding);
            }
            if (_.isUndefined(data[options.rootSetFunctionName])) {
                if (!data[options.restoreOptionsKey].hasSetter) {
                    data[options.rootSetFunctionName] = (function (self) {
                        return function (key, value) {
                            self[key] = value;
                        };
                    })(data);
                } else {
                    data[options.rootSetFunctionName] = data.set;
                }

                data.set = (function (self) {
                    return function (key, value) {
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
                    };
                })(data);
            }

            if (!data[options.restoreOptionsKey].hasGetter) {
                data.get = (function (self) {
                    return function (key) {
                        return self[key];
                    };
                })(data);
            }
        };

        var _setDataSource = function (datasource, originalElement, binding) {
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

            var bData = {
                keys: {},
                root: datasource
            };

            // Creates child bindings for an object.
            var childBindings = function (parent, bindingData) {
                var els = [];

                var children = parent.childTemplates;
                for (var i = 0; i < children.length; i++) {
                    if (!_.isNull(children[i].dependencyKey)) {
                        var dkey = children[i].dependencyKey;
                        var d;
                        if (_.isUndefined(dkey.parent)) {
                            d = _getDataProperty(bindingData.root, dkey.value);
                        } else {
                            d = _getDataProperty(_findBindingData(bindingData, dkey.parent.key), dkey.value);
                        }
                        if (_.isUndefined(d)) {
                            console.log(bindingData, children[i]);
                        }

                        for (var j = 0; j < d.length; j++) {
                            bindingData.keys[dkey.key] = d[j];
                            var childRoot = _cloneElement(children[i].baseElement, false);
                            childRoot.removeAttribute(options.attributePrefix + 'each-' + dkey.key);
                            var templateChildren = childBindings(children[i], bindingData);
                            for (var k = 0; k < templateChildren.length; k++) {
                                childRoot.appendChild(templateChildren[k]);
                            }

                            for (var k = 0; k < children[i].valueBindings.length; k++) {
                                var vbinding = children[i].valueBindings[k];
                                if (_.isNull(vbinding.dependency)) {
                                    var childData = _getDataProperty(bindingData.root, vbinding.value);
                                    if (!vbinding.nowatch) {
                                        _createObserver(vbinding.value, vbinding, bindingData.root, childRoot, binding);
                                    }
                                } else {
                                    var childData = _getDataProperty(_findBindingData(bindingData, vbinding.dependency.key), vbinding.value);
                                    if (!vbinding.nowatch) {
                                        _createObserver(vbinding.value, vbinding, bindingData.root, childRoot, binding);
                                    }
                                }

                                _binders[vbinding.type](childRoot, childData);
                                childRoot.removeAttribute(options.attributePrefix + vbinding.type);
                            }

                            els.push(childRoot);
                        }
                    } else {
                        var innerEl = _cloneElement(children[i].baseElement, false);
                        for (var j = 0; j < children[i].valueBindings.length; j++) {
                            var vbinding = children[i].valueBindings[j];
                            if (_.isNull(vbinding.dependency)) {
                                var d = _getDataProperty(bindingData.root, vbinding.value);
                                if (!vbinding.nowatch) {
                                    _createObserver(vbinding.value, vbinding, bindingData.root, innerEl, binding);
                                }
                            } else {
                                var valueData = _findBindingData(bindingData, vbinding.dependency.key);
                                var d = _getDataProperty(valueData, vbinding.value);
                                if (!vbinding.nowatch) {
                                    _createObserver(vbinding.value, vbinding, valueData, innerEl, binding);
                                }
                            }

                            _binders[vbinding.type](innerEl, d);
                            innerEl.removeAttribute(options.attributePrefix + vbinding.type);
                        }

                        templateChildren = childBindings(children[i], bindingData);
                        for (var j = 0; j < templateChildren.length; j++) {
                            innerEl.appendChild(templateChildren[j]);
                        }

                        els.push(innerEl);
                    }
                }

                return els;
            };

            var children = childBindings(root, bData);

            for (var i = 0; i < children.length; i++) {
                el.appendChild(children[i]);
            }

            binding.els = el;

            if (document.body.contains(originalElement)) {
                originalElement.parentNode.replaceChild(binding.els, originalElement);
            } else if (document.body.contains(currentElement)) {
                currentElement.parentNode.replaceChild(binding.els, currentElement);
            }
        };

        var _unbindDataSource = function (datasource, unbound, binding) {
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

                var ro = datasource[options.restoreOptionsKey];

                if (!_.isUndefined(ro) && _.isUndefined(datasource[options.watchersPropName])) {
                    if (ro.hasSetter) {
                        datasource.set == datasource[options.rootSetFunctionName];
                    } else {
                        delete datasource.set;
                    }

                    if (!ro.hasGetter) {
                        delete datasource.get;
                    }

                    delete datasource[options.rootSetFunctionName];
                    delete datasource[options.restoreOptionsKey];
                }

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
                        continue;
                    }

                    // If the property belongs to the instance or instance class.
                    if (Object.prototype.hasOwnProperty.call(datasource, prop)) {
                        // If not an array or an object go to next property.
                        if (_.isFunction(datasource[prop]) || !_.isObject(datasource[prop]) || _.isNull(datasource[prop]) || _.isUndefined(datasource[prop])) {
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
                                continue;
                            }
                            unbound.push(datasource);
                        } else {
                            unbound = [datasource];
                        }

                        // If the property is an array, add the array as a whole to the completed object list
                        // to prevent circular recursion, then unbind each individual object in the array.
                        if (_.isArray(datasource[prop])) {
                            unbound.push(datasource[prop]);
                            for (var j = 0; j < datasource[prop].length; j++) {
                                _unbindDataSource(datasource[prop][j], unbound, binding);
                            }
                        } else {
                            _unbindDataSource(datasource[prop], unbound, binding);
                        }
                    }
                }
            }
        };

        // Creates settings to use for unbinding the object at a later point in time.
        var _createRestoreOptions = function (datasource, binding) {
            if (_.isUndefined(datasource[options.restoreOptionsKey])) {
                datasource[options.restoreOptionsKey] = {
                    hasSetter: !_.isUndefined(datasource.set),
                    hasGetter: !_.isUndefined(datasource.get)
                };
            }
        };

        // Main bind method
        var bind = function (originalElement, data) {
            var binding = {
                _backup: originalElement,
                rootTemplate: _createTemplate(originalElement)
            };

            _createRestoreOptions(data, binding);

            binding.rootTemplate = _createDataBindings(binding.rootTemplate.dependencyKey, binding.rootTemplate);

            // Set data source method. Used internally and externally to rebind the entire obejct and recreate the HTML
            binding.setDataSource = (function (b, o) {
                return function (datasource) {
                    _unbindDataSource(b.datasource, null, b);
                    _setDataSource(datasource, o, b);
                };
            })(binding, originalElement);

            binding.setDataSource(data);

            binding.unbind = (function (b) {
                return function (command) {
                    _unbindDataSource(b.datasource, null, b);
                    if (!_.isUndefined(command)) {
                        if (command === 'remove') {
                            b.els.parentNode.removeChild(b.els);
                        } else if (command === 'reset') {
                            b.els.parentNode.replaceChild(b._backup, b.els);
                        }
                    }
                };
            })(binding);

            return binding;
        };

        return {
            options: options,
            bind: bind,
            binders: _binders
        };
    })();
})(this);
//# sourceMappingURL=ezbuynd-0.3.js.map
