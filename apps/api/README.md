# Relay API application

Owns the HTTP composition root for the modular monolith.

Suggested internal layout after the server framework is selected:

```text
src/
  modules/
    profiles/
    policy/
    mirror/
    connect/
    ledger/
    explanations/
    audit/
  platform/
    config/
    database/
    http/
    logging/
  server.*
tests/
```

Route handlers should validate input and delegate to feature use cases. They must not implement product calculations or bypass the data broker.
