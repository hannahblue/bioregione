# Design Decisions

This file records significant design decisions, the reasoning behind them, and open questions. It is a living document — update it as decisions are made or revisited.

---

## Naming

**Decision:** Project name is **Bioregione**

**Reasoning:** The word is identical in Italian and English, immediately descriptive of the project's core concept, and suggests both the ecological framing and the Italian pilot context. It is not a clever metaphor — it says what it is.

**Status:** Decided. Open to revision if a better name emerges from community input.

---

## Primary Organizing Principle

**Decision:** The coordination shorthand layer uses **watersheds as the primary organizing unit**, with ecoregion as the secondary frame.

**Reasoning:** Watersheds are the most intuitive bioregional unit for most people — they describe where water goes, which directly connects to questions of resource sharing, governance, and ecological health. They also tend to be politically neutral while being ecologically precise. The organizing question for this layer is: *"How will this help us work together better and be more respectful of each other and this place?"*

**Status:** Working assumption. Should be validated with pilot community.

---

## Two-Layer Architecture

**Decision:** The platform has two distinct layers:

1. **Reference Library** — pluralist, holds all naming systems, all classification frameworks, educational, accurate
2. **Coordination Shorthand** — opinionated, one primary name per region at each scale, optimized for community use and adoption

**Reasoning:** This resolves the tension between scientific completeness and usability. The reference library can hold contested boundaries and multiple naming traditions without forcing a choice. The shorthand layer must choose, and that choice is made through a participatory process (a future feature).

**Status:** Decided.

---

## Naming Governance

**Open question:** Who has authority to name a bioregion in the coordination shorthand layer?

**Options considered:**
- Editorial curation by a council (requires trust in the council)
- Proposal-and-vote by residents (requires definition of "resident")
- Algorithmic selection based on criteria (removes human judgment)
- Hybrid: proposal open to all, weighted vote favoring residents and indigenous stakeholders

**Status:** Unresolved. This is the most important governance question. The data model should support any of these options. The participation layer (Phase 2) will need to implement one.

---

## Indigenous and Historical Names

**Decision:** Indigenous and historical names are first-class data, not footnotes.

**Reasoning:** The reference library should document the full naming history of a place. For Italy specifically, this means: Latin/Roman names, Etruscan names (where documented), medieval names, and names used by local communities over time.

**Principle:** We will not display indigenous or sacred names without consent from the relevant communities. Where a name is considered sacred or not for public display, the record exists in the database but is flagged accordingly and not shown publicly.

**Status:** Principle decided. Implementation details TBD.

---

## Temporal Versioning

**Decision:** All bioregional boundaries and names carry `valid_from` and `valid_to` timestamps.

**Reasoning:** Bioregions change over time — due to climate change, ecological shifts, or revised scientific understanding. The historical record should be preserved. A region's name should be able to change while maintaining continuity of the record.

**Status:** Decided. Implemented in the PostGIS schema.

---

## Languages

**Decision:** Italian and English are co-primary languages from the start.

**Reasoning:** The pilot community is in Umbria, Italy. Building Italian as an afterthought would undermine the project's stated values about place and community.

**Implementation:** Next.js i18n routing with `[locale]` prefix. All UI strings in both languages. Data layer supports arbitrary language codes for names.

**Status:** Decided.

---

## Map Orientation

**Decision:** The map defaults to north-up but offers a south-up toggle.

**Reasoning:** South-up maps are a deliberate defamiliarization tool — they challenge the assumption that north is "up" and subtly shift the viewer's relationship to the map. However, making it the default would create unnecessary friction for first-time users. The toggle makes it an invitation rather than an imposition.

**Status:** Decided.

---

## Map Projection

**Decision:** Use **Equal Earth projection** for any static/print views. Web map uses standard Mercator (MapLibre default) with awareness of its distortions.

**Reasoning:** The Equal Earth projection (Šavrič et al. 2018) is area-accurate and aesthetically beautiful. MapLibre GL does not natively support non-Mercator projections for interactive maps without significant complexity. For the interactive map, the tradeoff is accepted. For portrait/print views, Equal Earth is preferred.

**Status:** Decided for interactive map. Equal Earth for static views is aspirational.

---

## Data Licensing

**Decision:** We use only open datasets and display attribution prominently.

**Non-negotiables:**
- WWF TEOW: attribution required, non-commercial use
- HydroSHEDS: CC BY 4.0, attribution required
- WDPA: attribution required, see specific terms
- OSM: ODbL, attribution required

**Status:** Decided. Attribution component built into every map view.

---

## Open Questions

- [ ] Should the participation layer use existing open-source tools (Decidim, Pol.is) or be built from scratch?
- [ ] What is the minimum viable definition of "resident" for participation purposes?
- [ ] How do we handle bioregions that cross national boundaries (e.g., the upper Tevere extends into Tuscany)?
- [ ] What scale should the "coordination shorthand" primary layer operate at — sub-watershed (community), watershed (regional), or ecoregion (bioregional)?
- [ ] How do we handle zones of ecological transition (ecotones) where boundaries are genuinely gradients rather than lines?
