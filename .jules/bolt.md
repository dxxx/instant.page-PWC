## 2025-02-19 - Dataset vs hasAttribute Performance
**Learning:** In `instantpage.js`, heavily accessing `element.dataset` in hot paths (like `mouseover` listeners) was a performance bottleneck. `dataset` creates a `DOMStringMap` proxy which is significantly slower than direct `hasAttribute()` calls.
**Action:** Prefer `element.hasAttribute('data-foo')` over `'foo' in element.dataset` for boolean checks in performance-critical code. Cache global properties like `location.origin` if accessed frequently.
