# Bolt's Journal

## 2024-05-22 - [Optimizing Dataset Access]
**Learning:** `element.dataset` access is significantly slower (~60x) than `element.hasAttribute` because it initializes a `DOMStringMap` proxy.
**Action:** Prefer `hasAttribute` for boolean checks and `getAttribute` for values in hot paths like event listeners.
