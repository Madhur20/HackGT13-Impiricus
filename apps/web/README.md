# Relay web application

Owns the responsive HCP and compliance interface.

Suggested internal layout after the UI framework is selected:

```text
src/
  app/                    bootstrapping, routes, layouts, providers
  components/             shared presentation components
  features/
    practice-mirror/
    doctor-connect/
    ledger/
    audit-timeline/
    persona-switcher/
  lib/                    typed API client and browser-only utilities
  styles/
tests/
```

Do not duplicate policy logic in the browser. The UI may explain server decisions but cannot authorize access.
