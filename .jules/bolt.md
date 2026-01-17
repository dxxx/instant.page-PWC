## 2024-05-22 - dataset vs getAttribute
**Learning:** `HTMLElement.dataset` initializes a `DOMStringMap` proxy which incurs significant performance overhead (~40-50x slower) compared to direct attribute access.
**Action:** Prefer `hasAttribute('data-foo')` and `getAttribute('data-foo')` over `dataset.foo` in hot paths like event listeners or loops.
