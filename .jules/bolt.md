## 2024-05-23 - DOMStringMap (dataset) Performance Overhead
**Learning:** Accessing `element.dataset` creates a `DOMStringMap` proxy, which is significantly slower (~40-50x) than `getAttribute`/`hasAttribute`. In `instantpage.js`, this was used in the `mouseover` hot path.
**Action:** For boolean checks, use `element.hasAttribute('data-foo')`. For values, use `element.getAttribute('data-foo')`. Avoid `dataset` in performance-critical event listeners.
