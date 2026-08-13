# 1 - Introduction

## 1.1 - Overview

### Node.js && JavaScript

Same Language, Different Runtime: Node.js and browser JavaScript share the same language syntax, but they `**run in fundamentally different environments with different capabilities and constraints**`.

| **Feature**        | **Browser JS**          | **Node.js**             |
| ------------------ | ----------------------- | ----------------------- |
| DOM Access         | ✅ Yes                  | ❌ No                   |
| File System Access | ❌ Limited              | ✅ Full                 |
| Global Object      | `window` / `globalThis` | `global` / `globalThis` |
| Network Servers    | ❌ No                   | ✅ Yes                  |
| Process Control    | ❌ No                   | ✅ Yes                  |
| Package Management | 📦 Limited              | 📦 npm/yarn/pnpm        |

> Node.js is not a language or a framework. It's a runtime environment that allows JavaScript to run outside the browser.
