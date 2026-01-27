## 2024-05-23 - [DOM Access Performance]
**Learning:** Accessing `dataset` via `HTMLElement.dataset` is significantly slower (up to ~60-80x) than `hasAttribute` or `getAttribute` because it involves a `DOMStringMap` Proxy instantiation and property lookup overhead. In hot paths like `mouseover` or `touchstart` handlers, this adds up.
**Action:** Prefer `hasAttribute('data-foo')` for boolean checks and `getAttribute('data-foo')` for value retrieval in performance-critical code.

## 2024-05-23 - [Location Property Access]
**Learning:** Accessing global `location.origin` (and other properties) involves a binding lookup that can be optimized by caching the value in a local variable if it's static for the page lifetime.
**Action:** Cache `location.origin` in a top-level variable for libraries that run in the browser context.
