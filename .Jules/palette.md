## 2026-01-18 - Test Server CSS Inlining
**Learning:** The `node test/index.js` server inlines `test/client/stylesheet.css` into the HTML response.
**Action:** Verify CSS changes by starting the server and `curl`-ing the root, then checking the `<style>` block.

## 2026-01-18 - Nested Input Cursor Inheritance
**Learning:** Inputs nested within `label` elements inherit `cursor: pointer` if applied to the label.
**Action:** Explicitly set `cursor: text` on text-based inputs when wrapping them in clickable labels.
