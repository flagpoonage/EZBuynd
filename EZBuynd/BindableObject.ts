// aM: AttributeMap
// cA: CurrentAttribute
// bA: BindingArray
// ai: ArrayItem

class BindableObject {
    watchers: IKeyWatcher[];
    get: (key: string) => any;
    set: (key: string, value: string) => void;
    __setRoot: (key: string, value: string) => void;
    constructor(aM?: any) {
        this.watchers = [];

        if (!_.isUndefined(aM.get)) {
            this.get = aM.get;
        }
        else {
            this.get = ((self: BindableObject) => {
                return (key: string): any => {
                    return self[key];
                }
            })(this);
        }

        if (!_.isUndefined(aM.set)) {
            this.__setRoot = aM.set;
        }
        else {
            this.__setRoot = ((self: BindableObject) => {
                return (key: string, value: any): void => {
                    self[key] = value;
                }
            })(this);
        }

        this.set = ((self: BindableObject) => {
            return (key: string, value: any): void => {
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
            }
        })(this);

        if (!_.isUndefined(aM) && !_.isNull(aM)) {
            for (var i in aM) {
                var cA = aM[i];
                if (!_.isNull(cA) &&
                    !_.isArray(cA) &&
                    !_.isFunction(cA) &&
                    _.isObject(cA)) {
                    cA = new BindableObject(cA);
                }
                else if (_.isArray(cA)) {
                    var bA = [];
                    for (var j = 0; j < cA.length; j++) {
                        var aI = cA[j];
                        if (!_.isNull(aI) &&
                            !_.isArray(aI) &&
                            !_.isFunction(aI) &&
                            _.isObject(aI)) {
                            bA.push(new BindableObject(aI));
                        }
                    }
                    cA = bA;
                }

                this[i] = cA;
            }
        }
    }
}  