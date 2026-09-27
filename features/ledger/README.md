# Ledger feature

Owns reviewed medicine-product update records, normalized before/after version comparison, physician relevance, and the governed handoff to Doctor Connect.

Ledger describes reviewed facts. It does not recommend treatment, change prescriptions, infer patient eligibility, or expose contact details outside Doctor Connect's mutual-consent flow.

The current `src/` schema-diff implementation is legacy, unused scaffolding from the superseded internal-tool concept and should be replaced by the reviewed product-version comparator before backend integration.
