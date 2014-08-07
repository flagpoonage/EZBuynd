var BindableObject = (function () {
    function BindableObject(attributeMap) {
        if (!_.isUndefined(attributeMap) && !_.isNull(attributeMap)) {
            for (var i in attributeMap) {
                var currentAttribute = attributeMap[i];
                if (!_.isNull(currentAttribute) && !_.isArray(currentAttribute) && !_.isFunction(currentAttribute) && _.isObject(currentAttribute)) {
                    currentAttribute = new BindableObject(currentAttribute);
                } else if (_.isArray(currentAttribute)) {
                    var bindableArray = [];
                    for (var j = 0; j < currentAttribute.length; j++) {
                        var arrayItem = currentAttribute[j];
                        if (!_.isNull(arrayItem) && !_.isArray(arrayItem) && !_.isFunction(arrayItem) && _.isObject(arrayItem)) {
                            bindableArray.push(new BindableObject(arrayItem));
                        }
                    }
                    currentAttribute = bindableArray;
                }

                this[i] = currentAttribute;
            }
        }
    }
    BindableObject.prototype.get = function (key) {
        return this[key];
    };

    BindableObject.prototype.set = function (key, value) {
        this[key] = value;
    };
    return BindableObject;
})();
//# sourceMappingURL=interfaces.js.map
