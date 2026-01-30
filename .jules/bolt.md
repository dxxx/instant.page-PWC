## 2024-05-22 - DOM Access Performance Patterns
**Learning:** Accessing `element.dataset` creates a `DOMStringMap` proxy which is significantly slower (~60x in benchmarks) than `element.hasAttribute()` or `element.getAttribute()`.
**Action:** In hot paths (like event handlers or loops), always prefer `hasAttribute('data-name')` over `'name' in dataset` and `getAttribute('data-name')` over `dataset.name`.

## 2024-05-22 - Caching Static Location Properties
**Learning:** Repeatedly accessing `location.origin` in hot paths can be optimized by caching it in a variable, as property access on the `location` object can involve overhead.
**Action:** Cache `location.origin` (and other static location properties) in a module-level variable during initialization if used frequently.
