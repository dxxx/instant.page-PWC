## 2024-05-22 - Nested Input Cursor Reset
**Learning:** When using implicit labels (wrapping inputs), applying `cursor: pointer` to the label causes text inputs to inherit the pointer cursor, which is confusing.
**Action:** Always explicitly reset `cursor: text` on text-based inputs (`[type="text"]`, etc.) when applying pointer cursors to parent labels.
