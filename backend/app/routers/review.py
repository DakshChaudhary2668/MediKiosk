"""Super Admin review endpoints.

Covers: read assessments awaiting review, approve/override/reject.
See docs/05-queue-and-approval.md for approval gate contract.
"""

from fastapi import APIRouter

router = APIRouter()
