## 2024-05-23 - Nested Input Cursor Handling
**Learning:** When adding `cursor: pointer` to a `<label>` element to improve affordance, any text-based `<input>` elements nested within it will inherit this cursor style, which is confusing for users trying to select text or type.
**Action:** Always explicitly reset the cursor to `text` for text-based inputs (text, number, email, etc.) nested within labels.
```css
form label {
  cursor: pointer;
}
form label input[type="text"] {
  cursor: text;
}
```
