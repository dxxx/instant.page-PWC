## 2024-05-23 - [Optimizing DOM Access in Event Handlers]
**Learning:** `HTMLElement.dataset` creates a `DOMStringMap` proxy on access, which is significantly slower than direct `getAttribute` or `hasAttribute` calls. In hot paths like event handlers (mouseover, touchstart), this overhead accumulates.
**Action:** Prefer `hasAttribute('data-foo')` over `'foo' in dataset` and `getAttribute('data-foo')` over `dataset.foo` in performance-critical code.
