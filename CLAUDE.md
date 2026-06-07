@AGENTS.md

## Request Efficiency Rules
- MAXIMIZE parallel tool calls — never make sequential calls when they're independent.
- NEVER spawn subagents (Agent tool) unless explicitly asked. Use Grep/Glob/Read directly.
- Combine multiple bash commands with && in a single call.
- Read multiple files in parallel, not one-by-one.
- Do NOT re-read files after editing — the Edit tool confirms success.
- Do NOT run exploratory searches before acting when the path is obvious.
- Minimize verification steps — skip redundant git status, ls, or grep after straightforward operations.
- Plan your full approach BEFORE making tool calls to avoid backtracking.
- Prefer fewer, larger edits over many small ones.
