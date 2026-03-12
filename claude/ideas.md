# Ideas

Bigger thoughts, directions worth exploring later. No commitment implied.

---

## Bioregional Time

One thing this project could do that almost no mapping platform does: show *time* as a first-class
dimension. Not just `valid_from`/`valid_to` for boundaries (already in schema), but an explorable
timeline — how did the Tiber watershed look before Roman land reclamation? What did the forest
cover look like in 1200 CE vs 1800 CE vs today? The Trasimeno crisis becomes much more legible
when you can see the water level chart alongside the map.

## Sound / Sensory Layer

Maps are almost always purely visual. This place has sounds — the Tiber, bird species in Monte
Subasio, the wind through karst caves at Monte Cucco. An optional ambient audio layer tied to
location/season could make the reference library genuinely immersive. Probably a v3 idea but
worth planting.

## Offline-first / Community Use

If this is for community coordination (farmers, activists, municipalities), internet access in
rural Umbria can be patchy. A PWA offline mode with cached tiles and last-known data would make
it actually useful in the field. The seed data is small enough to bundle.

## Participatory Naming

The "open question" in DECISIONS.md about governance of bioregional names is genuinely hard.
One model: treat proposed names as data with a `status` field (proposed, contested, adopted,
deprecated), display all of them on the map with visual differentiation, and let the community
mark consensus over time. The map itself becomes the record of the naming conversation.

## Other Bioregions as Future Pilots

Alto Tevere is a compelling first choice because of the Trasimeno crisis and the active citizen
movement. The next natural candidate might be somewhere with a similarly active community and
a cross-boundary ecological issue. The Danube basin? The Catalan Pyrenees? The platform
architecture should be bioregion-agnostic from the start.

## The "Coordination Shorthand" as a Mobile App

The two-layer architecture (Reference Library + Coordination Shorthand) maps almost perfectly
to desktop vs mobile use cases. The full reference library is a rich desktop experience;
the coordination shorthand wants to be a simple mobile view: "where am I, what's the name
of this place, who else is here, what's the crisis right now." Worth keeping this split
in mind as the design evolves.
