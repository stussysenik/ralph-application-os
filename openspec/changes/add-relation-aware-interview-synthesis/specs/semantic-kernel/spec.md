## MODIFIED Requirements

### Requirement: Ralph synthesizes a first semantic world model from answered interviews
The system SHALL infer a coherent first semantic graph from answered interviews, including relations when the interview provides enough structure to do so deterministically.

#### Scenario: Synthesize a screenshot-style relation graph
- **WHEN** the operator provides answered interview data for a screenshot capture and sharing product
- **THEN** the synthesizer SHALL infer relations between workspace, capture, annotation, collection, and share-link entities
- **AND** the resulting draft SHALL not keep a generic `relation-map` open question

#### Scenario: Synthesize a vision-commerce relation graph
- **WHEN** the operator provides answered interview data for a product scanning and alternative comparison system
- **THEN** the synthesizer SHALL infer relations for scan sessions, products, ingredient observations, recommendations, offers, and user profiles
- **AND** the resulting draft SHALL preserve a passing proof result
