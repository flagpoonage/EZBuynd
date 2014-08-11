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
            propertyBinder: '.'
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

        // Main bind method
        var bind = function (originalElement, data) {
            var binding = {
                datasource: data,
                rootTemplate: _createTemplate(originalElement)
            };

            binding.rootTemplate = _createDataBindings(binding.rootTemplate.dependencyKey, binding.rootTemplate);

            if (originalElement.hasAttribute('id')) {
                binding.rootTemplate.baseElement.setAttribute('id', originalElement.getAttribute('id'));
            }

            // Set data source method. Used internally and externally to rebind the entire obejct and recreate the HTML
            binding.setDataSource = function (datasource) {
                binding.datasource = datasource;

                var root = binding.rootTemplate;
                var el = _cloneElement(root.baseElement, false);
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
                                    } else {
                                        var childData = _getDataProperty(_findBindingData(bindingData, vbinding.dependency.key), vbinding.value);
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
                                } else {
                                    var d = _getDataProperty(_findBindingData(bindingData, vbinding.dependency.key), vbinding.value);
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
            };

            binding.setDataSource(data);

            if (document.body.contains(originalElement)) {
                originalElement.parentNode.replaceChild(binding.els, originalElement);
            }

            return binding;
        };

        return {
            options: options,
            bind: bind
        };
    })();
})(this);
//# sourceMappingURL=ezbuynd-0.3.js.map
