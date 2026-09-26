# Cross-product tests

- `contract/` verifies shared package interfaces and that products use the data broker.
- `integration/` verifies API, persistence adapters, policy, and feature composition.
- `e2e/` verifies critical user paths and the rehearsed demo.
- `fixtures/` contains immutable test-only inputs distinct from mutable demo seed data.

Unit tests live beside the package or feature they exercise.
