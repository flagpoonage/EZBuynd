EZBuynd
=======

Binding library for displaying and updating the DOM as the data source changes. There is no Object.observable or watch.js implementation, so all changes to data should happen through the get and set functions.

**'get' and 'set' functions**

The get and set function will be attached to the data source attribute hierarchy automatically once it is bound to a template. So even plain old javascript objects will be able to use the get and set functionality. This does impose a specific way to program when developing applications, which is the cost of supporting Internet Explorer 8. In the future a inbuilt observable pattern will be an optional inclusion for applications which do not require IE8 support.

**Backbone**


The get and set methods created on the object hierarchy should work harmoniously with Backbone (as this was the primary goal of use). Regardless of POJOs or Backbone models, the appropritate attributes should be set and retrieved correctly.

**Arrays**

The implementation of changes to arrays (and in future Backbone Collections) is still in progress with an incomplete version of Array.prototype.push functionality being available. Newly added items, inserted by a push call on an array of the attribute hierarchy, should be reflected in the DOM in most cases. This is incomplete because it doesn't work for *ALL* cases.

