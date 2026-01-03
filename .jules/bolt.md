# Bolt's Journal

## 2024-05-23 - Performance Verification in Test Environment
**Learning:** The `test` directory operates as an isolated environment with its own dependencies. The root `package.json` does not run tests.
**Action:** Always check `test/` directory for test scripts and run them directly or install dependencies there.
