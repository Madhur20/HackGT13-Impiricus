# Data broker

The mandatory data-access chokepoint. It requests a policy decision and returns only permitted fields with provenance.

Product code must not read restricted profiles, consents, or protected contacts around this boundary.
