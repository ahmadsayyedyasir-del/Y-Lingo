"""Admin authorization dependency (Phase 11).

Wraps the existing authenticated-active-user dependency from app.api.deps
without modifying that file — admin access is an additional check layered
on top of normal authentication, not a separate auth system.
"""

from __future__ import annotations

from fastapi import Depends

from app.api.deps import get_current_active_user
from app.core.exceptions import AdminAccessRequiredError
from app.models.user import User


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Reuses get_current_active_user (so 401 for missing/invalid/inactive
    accounts is handled exactly as everywhere else), then additionally
    requires is_admin=True.

    There is no endpoint anywhere that lets a user set their own is_admin
    flag — it is only ever changed via direct database access.
    """
    if not current_user.is_admin:
        raise AdminAccessRequiredError()
    return current_user