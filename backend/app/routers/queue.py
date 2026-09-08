"""Queue endpoints.

Covers: read doctor queue, queue state transitions.
Queue is backend-owned; only approved review decisions create entries.
See docs/05-queue-and-approval.md.
"""

from fastapi import APIRouter

router = APIRouter()
