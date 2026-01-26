## 2024-05-23 - [dataset vs hasAttribute and Location Object Caching]
**Learning:** Accessing `element.dataset` in a hot path (like `mouseover`/`touchstart` handlers) is significantly slower (~60x) than `element.hasAttribute()` because `dataset` involves a Proxy/DOMStringMap lookup. Similarly, repeatedly accessing `location.origin` (a getter) is slower (~19x) than caching it in a variable.
**Action:** When checking for the existence of data attributes in performance-critical code, prefer `hasAttribute('data-foo')` over `'foo' in dataset`. Cache static `location` properties.
