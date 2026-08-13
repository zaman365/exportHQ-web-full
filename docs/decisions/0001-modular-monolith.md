# ADR 0001: TypeScript modular monolith

Status: accepted

Export operations are relational and cross-functional. A modular monolith keeps transactions, authorization, and domain evolution coherent while customer and ops surfaces remain independently deployable. Microservices, Kafka, GraphQL, and Kubernetes are deferred until measured constraints justify them.
