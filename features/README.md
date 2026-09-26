# Product features

Each feature owns its product-specific computation, state transitions, and use cases. Features may use shared packages but must not import one another directly.

Cross-product behavior, such as Mirror opening a prefilled Connect question, is orchestrated by an application through shared domain contracts.
