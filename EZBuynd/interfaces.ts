/**
 * A watcher collection for a specific property on a specific HTML binding.
 */
interface IKeyWatcher {
    /**
     * The property retrieval/update key that this watcher collection applies to.
     */
    key: string;
    /**
     * The HTML binding that this watcher collection applies to
     */
    binding: IBinding;
    /**
     * A collection of watcher functions that will run when the property defined by the key is changed.
     */
    watchers: { (): void }[];
}

/**
 * Contains all available binding data for a HTML binding
 */
interface IBindingData {
    /**
     * The root binding data that is applied to this HTML binding
     */
    root: any;
    /**
     * Any specific pieces of subdata that is required by various dependencies.
     */
    keys: IBindingDataKey[];
}

/**
 * Contains a specific piece of binding data and optionally its dependancy on
 * other binding data.
 */
interface IBindingDataKey {
    /**
     * The name of the key that represnts this data.
     */
    key: string;
    /**
     * The dependency that this data has on a parent collection.
     */
    dependency: IDependencyKey;
    /**
     * The binding data.
     */
    data: any;
}

/**
 * Defines a binding template for a specific HTML element
 */
interface ITemplate {
    /**
     * The original source HTML element for this template.
     */
    sourceElement: HTMLElement;
    /**
     * The HTML for this specific element.
     */
    baseElement: HTMLElement;
    /**
     * Child templates representing each child of this HTML element
     */
    childTemplates: ITemplate[];
    /**
     * The datasource that is applied to this template.
     */
    datasource: any;
    /**
     * The dependency of this template on a parent data collection.
     */
    dependencyKey: IDependencyKey;
    /**
     * The collection of specific value bindings that apply to this HTML element in this DOM binding
     */
    valueBindings: IValueKey[];
}

/**
 * A key defining a way to access a specific collection of data and
 * its dependencies on other arrays of data
 */
interface IDependencyKey {
    /**
     * The root collection that this collection and all parents depend on
     */
    rootKey: IDependencyKey;
    /**
     * The direct parent collection that this collection depends on
     */
    parent: IDependencyKey;
    /**
     * The name of the key that represents this collection
     */
    key: string;
    /**
     * The retrieval key for the datasource that provides this collection
     */
    value: string;
    /**
     * A collection of dependency keys that depend on this one.
     */
    subkeys: IDependencyKey[];
}

/**
 * The details of an individual value binding key
 */
interface IValueKey {
    /**
     * Indicates the dependency of this binding on a parent datasource collection
     */
    dependency: IDependencyKey;
    /**
     * The retrieval key for the datasource of this binding.
     */
    value: string;
    /**
     * Indicates the type of the value binding
     */
    type: string;
    /**
     * Indicates that an observer should not be added to this specific binding, if the property
     * changes and the nowatch value is set to true on the binding, no update function will be called
     * for the DOM binding it applies to/
     */
    nowatch: boolean;
    /**
     * Indicates whether any change to the value of this binding should be logged to the console. 
     * This should only be used for debugging purposes.
     */
    logchange: boolean;
}

/**
 * The DOM binding object returned by the bind() method
 */
interface IBinding {
    /**
     * The root data source passed in the bind method.
     */
    datasource: any;
    /**
     * The current HTML elements that make up the entire binding.
     */
    els: HTMLElement;
    /**
     * A copy of the original HTML that the binding was created from.
     */
    _backup: HTMLElement;
    /**
     * The uppermost element in the HTML passed in the bind method.
     */
    rootTemplate: ITemplate;
    /**
     * Sets the data source of this binding and regenerates all HTML and bindings.
     * 
     * @param datasource The datasource to use in this binding.
     */
    setDataSource: (datasource: any) => void;
    /**
     * Unbinds the datasource, and optionally removes or resets the binding HTML
     * 
     * @command An optional command, accepts 'reset' or 'remove' as values. If the reset option is 
     * specified, the current HTML will be replaced by the original HTML before the binding first occured.
     * If the 'remove' command is specified, the current HTML is removed from the DOM. Once the remove command
     * is called, you will no longer be able to use this binding.
     */
    unbind: (command?: string) => void;
}

/**
 * A value binding on a specific HTML element.
 */
interface IValueBinding {
    /**
     * The binding attribute found on the element
     */
    bindingAttribute: IEzbuyndAttribute;
    /**
     * The element that this binding attribute is applied to.
     */
    el: HTMLElement;
}

/**
 * A collection of EZBuynd attributes found on an HTML element.
 */
interface IEzbuyndAttributes {
    /**
     * The collection of attributes
     */
    attributes: IEzbuyndAttribute[];
    /**
     * Indicates whether this collection contains an 'ignore' binding.
     */
    hasIgnore: boolean;
    /**
     * Indicates whether this collection contains an 'each' binding.
     */
    hasEach: boolean;
    /**
     * Indicates whether this collection contains any bindings.
     */
    hasAny: boolean;
    /**
     * Indicates whether this is a valid HTML element or something else.
     */
    isValidElement: boolean;
}

/**
 * A single EZBuynd attribute found on an HTML element
 */
interface IEzbuyndAttribute {
    /**
     * The type of binding eg 'ignore', 'each', 'html' etc..
     */
    type: string;
    /**
     * The property key of the data object for which this binding applies to.
     */
    value: string;
    /**
     * Additional arguments found in the attribute name eg 'ezb-each-value' - 'value' will be an attribute argument.
     */
    attributeArgs: string[];
    /**
     * Additional arguments found in the attribute value eg 'ezb-html="value|nowatch" - 'nowatch' will be a value argument.
     */
    valueArgs: string[];
    /**
     * The full name of the attribute including all arguments
     */
    fullname: string;
    /**
     * The full value of the attribute including all arguments.
     */
    fullvalue: string;
}

