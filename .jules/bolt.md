## 2026-01-24 - [Dataset vs hasAttribute]
**Learning:** `element.dataset` access incurs a significant performance overhead compared to `element.hasAttribute` because it initializes a `DOMStringMap` proxy. This is especially critical in hot paths like event handlers (`mouseover`, `touchstart`).
**Action:** Prefer `hasAttribute('data-foo')` over `'foo' in dataset` for boolean checks, and `getAttribute('data-foo')` over `dataset.foo` for value access in performance-critical code.
