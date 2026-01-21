## 2026-01-21 - Dataset Performance Overhead
**Learning:** `HTMLElement.dataset` uses a Proxy which incurs a performance penalty compared to `getAttribute`/`hasAttribute`. In hot paths (like mouseover listeners), this overhead is measurable.
**Action:** Prefer `hasAttribute('data-foo')` over `'foo' in element.dataset` for boolean checks, and `getAttribute('data-foo')` for value retrieval in performance-critical code.
