"""AI Engine adapter — integration boundary.

This module handles:
- Building the AI Engine request from intake data
- Calling Harry's AI Engine
- Validating and normalizing the response
- Attaching correlation metadata

The adapter MUST NOT mutate queue state, patient records,
doctor assignments, or approval state.

See docs/04-ai-pre-triage.md and docs/13-old-to-new-for-harry.md.
"""

# TBD: Implementation after AI contract is frozen with Harry
