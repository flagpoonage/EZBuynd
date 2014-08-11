interface IBindable {
    get(key: string): any;
    set(key: string, value: any): void;
}

interface IBindingData {
    root: IBindable;
    keys: IBindingDataKey[];
}

interface IBindingDataKey {
    key: string;
    dependency: IDependencyKey;
    data: IBindable;
}

interface ITemplate {
    sourceElement: HTMLElement;
    baseElement: HTMLElement;
    childTemplates: ITemplate[];
    datasource: any;
    updateFunction: () => void;
    valueFunction: (data: any) => void;
    dependencyKey: IDependencyKey;
    valueBindings: IValueKey[];
}

interface IElementWatcher {
    el: HTMLElement;

}

interface IDependencyKey {
    rootKey: IDependencyKey;
    parent: IDependencyKey;
    key: string;
    value: string;
    subkeys: IDependencyKey[];
}

interface IValueKey {
    dependency: IDependencyKey;
    value: string;
    type: string;
}

interface IBinding {
    datasource: IBindable;
    els: HTMLElement;
    rootTemplate: ITemplate;
    updateBinding: () => void;
    setDataSource: (datasource: any) => void;
}

interface IValueBinding {
    valueFn: (any, string) => void;
    updateFn: (any) => void;
    bindingAttribute: IEzbuyndAttribute;
    key: string;
    dependsOn: string;
    el: HTMLElement;
}

interface IEzbuyndAttributes {
    attributes: IEzbuyndAttribute[];
    hasIgnore: boolean;
    hasEach: boolean;
    hasAny: boolean;
    isValidElement: boolean;
}

interface IEzbuyndAttribute {
    type: string;
    value: string;
    attributeArgs: string[];
    valueArgs: string[];
    fullname: string;
    fullvalue: string;
}

interface IEachBinding {
    el: HTMLElement;
    parentBinding: IEachBinding;
    parentKey: string;
    name: string;
    collectiveFunction: (data: any) => any[];
}

interface IEZBuyndOptions {
    attributePrefix: string;
}

interface IRootBinding {
    el: HTMLElement;
    datasource: any;
    childbindings: IChildBinding[];
    valueBindings: IValueBinding[];
}

interface IChildBinding {
    el: HTMLElement;
    template: HTMLElement;
    rootDataSource: any;
    eachBoundSources: IEachBinding[];
    eachBinding: IEachBinding;
    eachBoundTargets: IChildBinding[];
    valueBindings: IValueBinding[];
}

class BindableObject implements IBindable {
    constructor(attributeMap?: any) {
        if (!_.isUndefined(attributeMap) && !_.isNull(attributeMap)) {
            for (var i in attributeMap) {
                var currentAttribute = attributeMap[i];
                if (!_.isNull(currentAttribute) &&
                    !_.isArray(currentAttribute) &&
                    !_.isFunction(currentAttribute) &&
                    _.isObject(currentAttribute)) {
                    currentAttribute = new BindableObject(currentAttribute);
                }
                else if (_.isArray(currentAttribute)) {
                    var bindableArray = [];
                    for (var j = 0; j < currentAttribute.length; j++) {
                        var arrayItem = currentAttribute[j];
                        if (!_.isNull(arrayItem) &&
                            !_.isArray(arrayItem) &&
                            !_.isFunction(arrayItem) &&
                            _.isObject(arrayItem)) {
                            bindableArray.push(new BindableObject(arrayItem));
                        }
                    }
                    currentAttribute = bindableArray;
                }

                this[i] = currentAttribute;
            }
        }
    }

    get(key: string): any {
        return this[key];
    }

    set(key: string, value: any) {
        this[key] = value;
    }
} 