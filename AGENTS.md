## graphify

This project can use a graphify knowledge graph at `graphify-out/`.

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure if it exists.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- To build the initial graph in Codex, use `$graphify .`.
- After modifying code files in this session, run `graphify update .` to keep the graph current when a graph already exists.
