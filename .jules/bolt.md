## 2024-05-23 - DOM Property Access Performance
**Learning:** Accessing `dataset` properties involves `DOMStringMap` proxy overhead which is significantly slower than `hasAttribute` for presence checks (~9x improvement in synthetic benchmark). Accessing global `location` properties (like `origin`) in hot paths also incurs overhead.
**Action:** In performance-critical event listeners, prefer `hasAttribute` over `dataset` and cache static global properties.
