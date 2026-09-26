# Applications

Applications contain delivery concerns. Business rules belong in `features/` or shared `packages/`.

- `web/` owns routes, screens, components, client state, and API adapters.
- `api/` owns HTTP routing, request validation, authentication/persona context, persistence adapters, and use-case composition.

The hackathon target is a modular monolith. These two directories do not imply separately deployed microservices.
