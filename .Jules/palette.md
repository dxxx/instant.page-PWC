## 2024-05-22 - Nested Input Cursor Patterns
**Learning:** When using `<label>` that wraps `<input>`, applying `cursor: pointer` to the label causes text inputs to also have a pointer cursor, which is confusing for text selection.
**Action:** Always explicitly override nested text/number inputs with `cursor: text` when styling parent labels with `cursor: pointer`.
