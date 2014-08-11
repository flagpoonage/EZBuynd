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

        var _extractAttributes = function (el, eb) {
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

                var keyParts = value.split(options.propertyBinder);
                var eachKey = keyParts[0];

                var truekey = null;

                for (var j = 0; j < eb.length; j++) {
                    if (eb[j].name === eachKey) {
                        truekey = keyParts.slice(1).join(options.propertyBinder);
                        break;
                    }
                }

                if (_.isNull(truekey)) {
                    eachKey = null;
                    truekey = value;
                }

                results.attributes.push({
                    fullname: attributes[i].name,
                    fullvalue: attributes[i].value,
                    attributeArgs: args,
                    value: truekey,
                    valueArgs: arguments,
                    type: type,
                    dependsOn: eachKey
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

        var _getValueBinding = function (el, attr) {
            return function (value) {
                _binders[attr.type](el, value);
            };
        };

        var _duplicateElement = function (el) {
            var dup = document.createElement(el.tagName);

            var attributes = el.attributes;

            for (var i = 0; i < attributes.length; i++) {
                dup.setAttribute(attributes[i].name, attributes[i].value);
            }

            return dup;
        };

        var _createRootValueBindings = function (el) {
            var bindings = [];

            var attr = _extractAttributes(el, []).attributes;

            for (var i = 0; i < attr.length; i++) {
                var a = attr[i];
                if (a.type === 'each') {
                    continue;
                }

                if (a.type === 'ignore') {
                    break;
                }

                var vbind = {
                    el: el,
                    dependsOn: null,
                    bindingAttribute: a,
                    key: a.value
                };

                vbind.valueFn = (function (k) {
                    return function (data) {
                        var keyParts = k.split(options.propertyBinder);
                        for (var i = 0; i < keyParts.length; i++) {
                            if (!_.isUndefined(data.get)) {
                                data = data.get(keyParts[i]);
                            } else {
                                data = data[keyParts[i]];
                            }
                        }
                        return data;
                    };
                })(a.value);

                vbind.updateFn = _getValueBinding(vbind.el, a);

                bindings.push(vbind);
            }

            return bindings;
        };

        var _createValueBindings = function (el, eachBindings) {
            var bindings = [];

            var attr = _extractAttributes(el, eachBindings);

            if (attr.hasIgnore) {
                return [];
            }

            for (var i = 0; i < attr.attributes.length; i++) {
                var a = attr.attributes[i];
                if (a.type === 'each') {
                    continue;
                }

                var vbind = {
                    bindingAttribute: a,
                    updateFn: null,
                    valueFn: null,
                    dependsOn: a.dependsOn,
                    el: el
                };

                vbind.valueFn = (function (k) {
                    return function (data) {
                        var keyParts = k.split(options.propertyBinder);
                        for (var i = 0; i < keyParts.length; i++) {
                            if (!_.isUndefined(data.get)) {
                                data = data.get(keyParts[i]);
                            } else {
                                data = data[keyParts[i]];
                            }
                        }
                        return data;
                    };
                })(a.value);

                el.removeAttribute(a.fullname);

                bindings.push(vbind);
            }

            for (var i = 0; i < el.children.length; i++) {
                var childBindings = _createValueBindings(el.children[i], eachBindings);
                bindings = bindings.concat(childBindings);
            }

            return bindings;
        };

        var _buildHtmlTemplate = function (el, parent, eb) {
            var e = _duplicateElement(el);

            var attr = _extractAttributes(el, eb);

            if (attr.hasEach) {
                var each = _getEach(attr);
                parent.setAttribute('ezb-each-' + each.attributeArgs[0], '');
                return;
            } else {
                for (var i = 0; i < el.children.length; i++) {
                    var template = _buildHtmlTemplate(el.children[i], el, eb);
                    if (!_.isUndefined(template)) {
                        e.appendChild(template);
                    }
                }
            }

            return e;
        };

        var _generateBaseHTML = function (el, parent, eb) {
            var e = _duplicateElement(el);
            var attr = _extractAttributes(el, eb);

            if (attr.hasEach) {
                var each = _getEach(attr);
                parent.setAttribute('ezb-each-' + each.attributeArgs[0], '');
                return;
            } else {
                for (var i = 0; i < el.children.length; i++) {
                    var template = _generateBaseHTML(el.children[i], e, eb);
                    if (!_.isUndefined(template)) {
                        e.appendChild(template);
                    }
                }
            }

            return e;
        };

        var _matchEachBinding = function (eachtag, eb) {
            for (var i = 0; i < eb.length; i++) {
                if (eb[i].name === eachtag.dependsOn) {
                    return eb[i];
                }
            }

            return;
        };

        var _createEachBinding = function (el, eb) {
            var attr = _extractAttributes(el, eb);
            var eachTag = _getEach(attr);
            var eachBinding = _matchEachBinding(eachTag, eb);

            var binding = {
                parentBinding: eachBinding,
                name: eachTag.attributeArgs[0],
                collectiveFunction: null,
                el: el
            };

            if (_.isUndefined(eachBinding)) {
                binding.collectiveFunction = (function (k) {
                    return function (data) {
                        var keyParts = k.split(options.propertyBinder);
                        for (var i = 0; i < keyParts.length; i++) {
                            if (!_.isUndefined(data.get)) {
                                data = data.get(keyParts[i]);
                            } else {
                                data = data[keyParts[i]];
                            }
                        }
                        return data;
                    };
                })(eachTag.value);
            }

            return binding;
        };

        var _createChildBinding = function (el, parent, rootDataSource, eb) {
            var temp = _generateBaseHTML(el, parent, eb);

            var attr = _extractAttributes(el, eb);

            if (attr.hasIgnore) {
                return;
            }

            var bSource = [].concat(eb);

            var binding = {
                el: el,
                rootDataSource: rootDataSource,
                eachBoundSources: bSource
            };

            if (_.isUndefined(el)) {
                binding.eachBinding = _createEachBinding(el, eb);
                var attributes = el.attributes;
                for (var i = 0; i < attributes.length; i++) {
                    if (attributes[i].name.indexOf('ezb-each-') === 0) {
                        binding.el.removeAttribute(attributes[i].name);
                        break;
                    }
                }

                eb.push(binding.eachBinding);
            }

            binding.valueBindings = _createValueBindings(el, eb);

            // Nested each templates have been removed from the current element,
            // but the each bindings for the templates have not been retrieved.
            return binding;
        };

        var bind = function (el, data) {
            var attrs = _extractAttributes(el, []);

            var rootBinding = {
                datasource: data,
                el: el,
                childbindings: [],
                valueBindings: []
            };

            rootBinding.valueBindings = _createRootValueBindings(el);

            for (var i = 0; i < el.children.length; i++) {
                var child = el.children[i];
                var childBinding = _createChildBinding(child, el, data, []);
                rootBinding.childbindings.push(childBinding);
            }

            return rootBinding;
        };

        return {
            bind: bind,
            options: options
        };
    })();
})(this);
//# sourceMappingURL=ezbuynd-0.2.js.map
