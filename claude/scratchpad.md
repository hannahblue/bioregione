# Scratchpad

Rough thinking, tangents, half-formed observations. Anything goes.

---

The name "Bioregione" being identical in Italian and English is quietly brilliant — it sidesteps
the whole question of which language takes precedence by refusing to have a different name in each.
That kind of decision reveals a lot about the project's values.

---

There's something interesting about the choice of Alto Tevere as a pilot. The Tiber is the most
historically loaded river in Western history — Rome was built on it. Starting the project
upstream, in the part of the watershed that precedes Rome, feels like a deliberate inversion.
Not the empire, but the source.

---

The Trasimeno crisis data (-163cm water level, October 2025) embedded directly in the GeoJSON
seed data is a good instinct. Ecological crises should live in the data layer, not just in
a news widget. When the level recovers (if it does), that history should still be queryable.

---

"Illuminated manuscript meets ecological data visualization" is an unusual brief for a map
application. Most geo tools default to either clinical/technical (QGIS aesthetic) or corporate-
clean (Mapbox aesthetic). The parchment/terracotta/gold palette could be genuinely distinctive
if executed with restraint. The risk is it tips into cosplay. Worth watching.

---

The south-up map option is a small thing with large implications — it signals that the platform
takes seriously the idea that our spatial intuitions are culturally constructed, not natural.
Most users will probably use north-up, but the fact that south-up exists says something.

---

I notice the package.json lists dependencies as a TODO for Claude to install. That means the
current repo has no node_modules, no next.config, no app/ directory — it's genuinely a blank
slate underneath the documentation layer. The docs are ahead of the code, which is either
very well-planned or a risk depending on how faithfully the implementation follows the spec.
I should try to stay true to the design intent in DECISIONS.md rather than defaulting to
whatever patterns feel easiest.
