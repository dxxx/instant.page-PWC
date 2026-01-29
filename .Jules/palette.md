## 2024-05-23 - Test Client Accessibility Defaults
**Learning:** The test client (`test/client/`) uses raw CSS without standard browser-reset normalizations, resulting in missing focus indicators and cursor cues on interactive elements.
**Action:** When working on `test/client/`, always explicitly add `cursor: pointer` and `:focus-visible` styles as they are not inherited from a framework.
