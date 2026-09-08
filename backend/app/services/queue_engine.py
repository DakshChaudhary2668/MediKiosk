"""Queue engine — backend-owned queue allocation logic.

Only approved review decisions create queue entries.
P0 bypasses normal queue (exact path TBD).
P1/P2/P3 ordered by priority band, then arrival/approval timestamp.

See docs/05-queue-and-approval.md.
"""

# TBD: Implementation after queue ordering rules are finalized
