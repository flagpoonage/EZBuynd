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

        var _getPropertyBindingFunction = function (data, key) {
            return function () {
                var keyParts = key.split(options.propertyBinder);
                var dval = data;
                for (var i = 0; i < keyParts.length; i++) {
                    if (!_.isUndefined(dval.get)) {
                        dval = dval.get(keyParts[i]);
                    } else {
                        dval = dval[keyParts[i]];
                    }
                }
                return dval;
            };
        };

        var _getValueBinding = function (el, attr) {
            return function (valueFn) {
                _binders[attr.type](el, valueFn());
            };
        };

        var _eachBind = function (el, attributes, eachAttr, data, eachBindings) {
            var attributeValue = eachAttr.value.split(options.propertyBinder);
            var collectiveFn;

            var binding = {
                eachName: eachAttr.attributeArgs[0],
                valueBindings: [],
                parentBinding: null,
                parentKey: null,
                collectiveFunction: null,
                currentIndex: null
            };

            for (var i = 0; i < eachBindings.length; i++) {
                if (eachBindings[i].eachName === attributeValue[0]) {
                    binding.parentBinding = eachBindings[i];
                    binding.parentKey = attributeValue.slice(1).join(options.propertyBinder);
                }
            }

            if (_.isUndefined(binding.parentBinding) || _.isNull(binding.parentBinding)) {
                binding.collectiveFunction = _getPropertyBindingFunction(data, eachAttr.value);
            }

            return binding;
        };

        var _createAttributeBindings = function (el, attributes, rootBinding) {
            var a = attributes.attributes;
            for (var i = 0; i < a.length; i++) {
                var vbinding = {
                    bindingAttribute: a[i],
                    updateFn: null,
                    valueFn: null,
                    key: a[i].value,
                    el: el
                };

                if (a[i].type === 'each') {
                    continue;
                }

                var v = a[i].value.split(options.propertyBinder);
                var eb;

                vbinding.valueFn = function (data, key) {
                    var keyParts = key.split(options.propertyBinder);
                    var dval = data;
                    for (var i = 0; i < keyParts.length; i++) {
                        if (!_.isUndefined(dval.get)) {
                            dval = dval.get(keyParts[i]);
                        } else {
                            dval = dval[keyParts[i]];
                        }
                    }
                    return dval;
                };

                vbinding.updateFn = _getValueBinding(el, a[i]);

                for (var j = 0; j < rootBinding.eachBindings.length; j++) {
                    if (rootBinding.eachBindings[j].eachName === v[0]) {
                        eb = rootBinding.eachBindings[j];
                        break;
                    }
                }

                if (!_.isUndefined(eb)) {
                    vbinding.key = v.slice(1).join(options.propertyBinder);
                    eb.valueBindings.push(vbinding);
                } else {
                    rootBinding.valueBindings.push(vbinding);
                }
            }
        };

        var bind = function (el, data, rootBinding) {
            var attrs = _extractAttributes(el);

            var binding = {
                valueBindings: [],
                eachBindings: [],
                childBindings: [],
                el: el
            };

            if (attrs.hasIgnore) {
                return;
            } else if (attrs.hasAny) {
                if (attrs.hasEach) {
                    if (!_.isUndefined(rootBinding)) {
                        binding.eachBindings = rootBinding.eachBindings;
                    }

                    var ebinding = _eachBind(el, attrs, _getEach(attrs), data, binding.eachBindings);
                    binding.eachBindings.push(ebinding);
                }

                binding.valueBindings = [];
                _createAttributeBindings(el, attrs, binding);
            }

            if (el.hasChildNodes()) {
                for (var i = 0; i < el.children.length; i++) {
                    var childBinding = bind(el.children[i], data, rootBinding);
                    binding.childBindings.push(childBinding);
                }
            }

            return binding;
        };

        return {
            bind: bind,
            options: options
        };
    })();
})(this);
//# sourceMappingURL=ezbuynd-0.1.js.map
