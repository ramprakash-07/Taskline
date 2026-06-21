"""
Authentication middleware.
Supports both Clerk JWT (authenticated users) and Guest sessions (X-Guest-ID header).
"""

import uuid
from datetime import datetime, timezone
from typing import Tuple

import jwt
from jwt import PyJWKClient
from fastapi import Request, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import get_settings
from app.database import get_database

# Cache the JWK client instance for performance
_jwk_client: PyJWKClient = None


def _get_jwk_client() -> PyJWKClient:
    """Get or create the cached JWK client."""
    global _jwk_client
    if _jwk_client is None:
        settings = get_settings()
        _jwk_client = PyJWKClient(
            settings.CLERK_JWKS_URL,
            cache_keys=True,
            lifespan=3600,  # Cache keys for 1 hour
        )
    return _jwk_client


async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency that extracts and verifies the Clerk JWT token.
    
    Returns the user ID (sub claim) from the verified token.
    Raises HTTPException 401 if token is missing or invalid.
    """
    # Extract Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Parse Bearer token
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    try:
        # Get the signing key from Clerk's JWKS endpoint
        jwk_client = _get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        # Decode and verify the JWT
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_exp": True,
                "verify_aud": False,  # Clerk tokens may not have audience
                "verify_iss": False,  # We verify via JWKS instead
            },
        )

        # Extract user ID from the 'sub' claim
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing 'sub' claim",
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_or_guest(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Tuple[str, bool]:
    """
    Flexible auth dependency supporting both Clerk JWT and Guest sessions.
    
    Returns a tuple of (user_id: str, is_guest: bool).
    
    Priority:
    1. Authorization: Bearer <token> → Clerk JWT → (clerk_user_id, False)
    2. X-Guest-ID: <uuid> → Guest session → (guest_id, True)
    3. 401 if neither
    """
    # 1. Try Clerk JWT first
    auth_header = request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            try:
                jwk_client = _get_jwk_client()
                signing_key = jwk_client.get_signing_key_from_jwt(parts[1])
                payload = jwt.decode(
                    parts[1],
                    signing_key.key,
                    algorithms=["RS256"],
                    options={
                        "verify_exp": True,
                        "verify_aud": False,
                        "verify_iss": False,
                    },
                )
                user_id = payload.get("sub")
                if user_id:
                    return (user_id, False)
            except Exception:
                pass  # Fall through to guest check

    # 2. Try Guest ID
    guest_id = request.headers.get("X-Guest-ID")
    if guest_id:
        # Validate UUID format
        try:
            uuid.UUID(guest_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid guest ID format",
            )

        # Verify guest session exists and is not expired
        session = await db.guest_sessions.find_one({
            "guest_id": guest_id,
            "expires_at": {"$gt": datetime.now(timezone.utc)},
        })

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Guest session expired or not found",
            )

        return (guest_id, True)

    # 3. Neither — unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide a Bearer token or X-Guest-ID header.",
        headers={"WWW-Authenticate": "Bearer"},
    )
