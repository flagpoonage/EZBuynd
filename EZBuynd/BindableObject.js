// aM: AttributeMap
// cA: CurrentAttribute
// bA: BindingArray
// ai: ArrayItem
var BindableObject = (function () {
    function BindableObject(aM) {
        this.watchers = [];

        if (!_.isUndefined(aM.get)) {
            this.get = aM.get;
        } else {
            this.get = (function (self) {
                return function (key) {
                    return self[key];
                };
            })(this);
        }

        if (!_.isUndefined(aM.set)) {
            this.__setRoot = aM.set;
        } else {
            this.__setRoot = (function (self) {
                return function (key, value) {
                    self[key] = value;
                };
            })(this);
        }

        this.set = (function (self) {
            return function (key, value) {
                self.__setRoot(key, value);
                var w;
                for (var i = 0; i < self.watchers.length; i++) {
                    if (key === self.watchers[i].key) {
                        w = self.watchers[i].watchers;
                        break;
                    }
                }

                if (!_.isUndefined(w)) {
                    for (var i = 0; i < w.length; i++) {
                        w[i]();
                    }
                }
            };
        })(this);

        if (!_.isUndefined(aM) && !_.isNull(aM)) {
            for (var i in aM) {
                var cA = aM[i];
                if (!_.isNull(cA) && !_.isArray(cA) && !_.isFunction(cA) && _.isObject(cA)) {
                    cA = new BindableObject(cA);
                } else if (_.isArray(cA)) {
                    var bA = [];
                    for (var j = 0; j < cA.length; j++) {
                        var aI = cA[j];
                        if (!_.isNull(aI) && !_.isArray(aI) && !_.isFunction(aI) && _.isObject(aI)) {
                            bA.push(new BindableObject(aI));
                        }
                    }
                    cA = bA;
                }

                this[i] = cA;
            }
        }
    }
    return BindableObject;
})();
//# sourceMappingURL=BindableObject.js.map
