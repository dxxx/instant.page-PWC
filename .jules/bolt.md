## 2024-05-23 - DOM Access Performance
**Learning:** Accessing `element.dataset` is significantly slower (~100x) than `element.hasAttribute()` for checking attribute existence, due to the Proxy overhead in `DOMStringMap`. Also, repeated access to `location.origin` is slower (~14x) than accessing a cached variable.
**Action:** Use `hasAttribute('data-kebab-case')` instead of `'camelCase' in dataset` for boolean checks in hot paths. Cache `location` properties in variables if accessed frequently in loops or event handlers.
