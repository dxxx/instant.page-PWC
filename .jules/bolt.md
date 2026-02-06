## 2024-05-22 - Dataset vs hasAttribute
**Learning:** `dataset` access creates a `DOMStringMap` proxy which has significant overhead compared to `hasAttribute` or `getAttribute`. In high-frequency hot paths (like `mouseover` handlers in `instantpage.js`), this overhead is measurable.
**Action:** Prefer `hasAttribute('data-foo')` over `'foo' in dataset` for boolean checks, and `getAttribute('data-foo')` over `dataset.foo` for value retrieval in performance-critical code.
