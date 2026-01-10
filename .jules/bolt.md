# Bolt's Journal

## 2025-02-18 - Dataset Performance
**Learning:** `element.hasAttribute('data-foo')` is significantly faster than `'foo' in element.dataset` (~50x in micro-benchmarks). The `DOMStringMap` proxy overhead is real and significant in hot paths.
**Action:** Prefer `hasAttribute` / `getAttribute` over `dataset` in performance-critical code, especially loop-heavy or interaction-heavy paths like mouseover/touch listeners.
