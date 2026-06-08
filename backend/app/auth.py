"""
Clerk JWT authentication middleware.
Verifies tokens against Clerk's JWKS endpoint.
"""

import jwt
from jwt import PyJWKClient
from fastapi import Request, HTTPException, status
from app.config import get_settings

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
