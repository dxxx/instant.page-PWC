## 2026-02-05 - Test Client Interaction Cues
**Learning:** The test client (`test/client/`) uses `label` elements to wrap inputs but completely lacks visual cues (cursor, hover states) to indicate interactivity, making the form feel static.
**Action:** Ensure all future changes to the test client explicitly add `cursor: pointer` to labels and interactive elements, as the base styles do not provide this.
