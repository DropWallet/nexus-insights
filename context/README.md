# Context bank (MVP)

Place Markdown files here for the LLM to reference when analyzing user feedback.

- Export key Confluence pages as Markdown (or paste content into `.md` files).
- Include Nexus Mods and modding terminology: Vortex, Collections, LOOT, ESP/ESL, load order, etc.
- At analysis time, the API will read files from this folder and inject relevant snippets into the Claude prompt.

No vector DB for MVP: we use simple file read + concatenation or a single canonical `context.md`.
