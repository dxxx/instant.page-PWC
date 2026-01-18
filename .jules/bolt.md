## 2024-05-22 - [Optimizing DOM interactions in hot paths]
**Learning:** `element.dataset` access involves a `DOMStringMap` proxy overhead. In high-frequency event handlers (like mouseover/touchstart in `instantpage.js`), replacing `dataset` checks with `element.hasAttribute('data-foo')` avoids this overhead and allocation.
**Action:** Prefer `hasAttribute` / `getAttribute` over `dataset` for boolean flags or simple reads in performance-critical code sections.
