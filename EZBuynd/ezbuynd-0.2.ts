((globe) => {
    globe.EZB = (() => {
        var _binders = {
            text: (el: HTMLElement, value: any): void => {
                if (_.isUndefined(el.textContent)) {
                    el.innerText = value;
                }
                else {
                    el.textContent = value;
                }
            },
            html: (el: HTMLElement, value: any): void => {
                el.innerHTML = value;
            },
            value: (el: HTMLElement, value: any): void => {
                el.setAttribute('value', value);
            }
        }

        var options = {
            attributePrefix: 'ezb-',
            valueArgSeperator: '|',
            propertyBinder: '.'
        }

        var _extractAttributes = (el: Element, eb: IEachBinding[]): IEzbuyndAttributes => {
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

                results.attributes.push(<IEzbuyndAttribute>{
                    attributeArgs: args,
                    value: truekey,
                    valueArgs: arguments,
                    type: type,
                    dependsOn: eachKey
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

        var _getEach = (attrs: IEzbuyndAttributes): IEzbuyndAttribute => {
            for (var i = 0; i < attrs.attributes.length; i++) {
                if (attrs.attributes[i].type === 'each') {
                    return attrs.attributes[i];
                }
            }
            return;
        }

        var _getValueBinding = (el: HTMLElement, attr: IEzbuyndAttribute): (parameter: () => any) => void => {
            return (value: any) => {
                _binders[attr.type](el, value);
            }
        }

        var _duplicateElement = (el: HTMLElement): HTMLElement => {
            var dup = document.createElement(el.tagName);

            var attributes = el.attributes;

            for (var i = 0; i < attributes.length; i++) {
                var isBinding = attributes[i].name.indexOf('ezb-') === 0;
                if (!isBinding) {
                    dup.setAttribute(attributes[i].name, attributes[i].value);
                }
            }

            return dup;
        }

        var _createRootValueBindings = (el: HTMLElement): IValueBinding[] => {
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

                var vbind = <IValueBinding> {
                    el: el,
                    dependsOn: null,
                    bindingAttribute: a,
                    key: a.value
                }

                vbind.valueFn = ((k) => { 
                    return (data: any) => {
                        var keyParts = k.split(options.propertyBinder);
                        for (var i = 0; i < keyParts.length; i++) {
                            if (!_.isUndefined(data.get)) {
                                data = data.get(keyParts[i]);
                            }
                            else {
                                data = data[keyParts[i]];
                            }
                        }
                        return data;
                    }
                })(a.value);

                vbind.updateFn = _getValueBinding(vbind.el, a);

                bindings.push(vbind);
            }

            return bindings;
        }

        var _createValueBindings = (el: HTMLElement, eachBindings: IEachBinding[]): IValueBinding[] => {
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

                var vbind = <IValueBinding> {
                    bindingAttribute: a,
                    updateFn: null,
                    valueFn: null,
                    dependsOn: a.dependsOn
                };

                vbind.valueFn = ((k) => { 
                    return (data: any) => {
                        var keyParts = k.split(options.propertyBinder);
                        for (var i = 0; i < keyParts.length; i++) {
                            if (!_.isUndefined(data.get)) {
                                data = data.get(keyParts[i]);
                            }
                            else {
                                data = data[keyParts[i]];
                            }
                        }
                        return data;
                    }
                })(a.value);

                bindings.push(vbind);
            }

            for (var i = 0; i < el.children.length; i++) {
                bindings.concat(_createValueBindings(el.children[i], eachBindings));
            }

            return bindings;
        }

        var _buildHtmlTemplate = (el: HTMLElement, parent: HTMLElement, eb: IEachBinding[]): HTMLElement => {
            var e = _duplicateElement(el);

            var attr = _extractAttributes(el, eb);

            if (attr.hasEach) {
                var each = _getEach(attr);
                parent.setAttribute('ezb-each-' + each.attributeArgs[0], '');
                return;
            }
            else {
                for (var i = 0; i < el.children.length; i++) {
                    var template = _buildHtmlTemplate(<HTMLElement>el.children[i], el, eb);
                    if (!_.isUndefined(template)) {
                        e.appendChild(template);
                    }
                }
            }

            return e;
        }

        var _matchEachBinding = (eachtag: IEzbuyndAttribute, eb: IEachBinding[]): IEachBinding => {
            for (var i = 0; i < eb.length; i++) {
                if (eb[i].name === eachtag.dependsOn) {
                    return eb[i];
                }
            }

            return;
        }

        var _createEachBinding = (el: HTMLElement, eb: IEachBinding[]): IEachBinding => {
            var e = _duplicateElement(el);
            var attr = _extractAttributes(el, eb);
            var eachTag = _getEach(attr);
            var eachBinding = _matchEachBinding(eachTag, eb);

            var binding = <IEachBinding>{                
                parentBinding: eachBinding,
                name: eachTag.attributeArgs[0],
                collectiveFunction: null,
            };

            if (_.isUndefined(eachBinding)) {
                binding.collectiveFunction = ((k) => { 
                    return (data: any) => {
                        var keyParts = k.split(options.propertyBinder);
                        for (var i = 0; i < keyParts.length; i++) {
                            if (!_.isUndefined(data.get)) {
                                data = data.get(keyParts[i]);
                            }
                            else {
                                data = data[keyParts[i]];
                            }
                        }
                        return data;
                    }
                })(eachTag.value);
            }

            return binding;
        }

        var _createChildBinding = (el: HTMLElement, parent: HTMLElement, rootDataSource: any, eb: IEachBinding[]): IChildBinding => {
            var template = _buildHtmlTemplate(el, parent, eb);

            var attr = _extractAttributes(el, eb);

            if (attr.hasIgnore) {
                return;
            }

            var bSource = [].concat(eb);

            var binding = <IChildBinding>{
                el: el,
                template: template,
                rootDataSource: rootDataSource,
                eachBoundSources: bSource,
            }

            if (_.isUndefined(template)) {
                binding.eachBinding = _createEachBinding(el, eb);
                var attributes = el.attributes;
                for (var i = 0; i < attributes.length; i++) {
                    if (attributes[i].name.indexOf('ezb-each-') === 0) {
                        binding.el.removeAttribute(attributes[i].name);
                        break;
                    }
                }

                binding.template = _buildHtmlTemplate(el, parent, eb);

                eb.push(binding.eachBinding);
            }

            binding.valueBindings = _createValueBindings(binding.template, eb);

            // Nested each templates have been removed from the current element, 
            // but the each bindings for the templates have not been retrieved.

            return binding;
        }

        var bind = (el: HTMLElement, data: IBindable): IRootBinding => {
            var attrs = _extractAttributes(el, []);

            var rootBinding = <IRootBinding>{
                datasource: data,
                element: el,
                childbindings: [],
                valueBindings: []
            };

            rootBinding.valueBindings = _createRootValueBindings(el);

            for (var i = 0; i < el.children.length; i++) {
                var child = el.children[i];
                var childBinding = _createChildBinding(<HTMLElement>child, el, data, []);
                rootBinding.childbindings.push(childBinding);
            }

            return rootBinding;
        }

        return {
            bind: bind,
            options: options
        };
    })();
})(this); 