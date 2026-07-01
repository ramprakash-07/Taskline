"""WebSocket manager for real-time room queue updates."""

import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import jwt
from jwt import PyJWKClient
from app.config import get_settings

# Active connections: room_id -> set of WebSockets
_connections: Dict[str, Set[WebSocket]] = {}
_jwk_client = None


def _get_jwk_client():
    """Get or create the cached JWK client for WebSocket token verification."""
    global _jwk_client
    if _jwk_client is None:
        settings = get_settings()
        _jwk_client = PyJWKClient(settings.CLERK_JWKS_URL, cache_keys=True, lifespan=3600)
    return _jwk_client


async def verify_ws_token(token: str) -> str | None:
    """Verify Clerk JWT from WebSocket query param. Returns user_id or None."""
    try:
        jwk_client = _get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_exp": True,
                "verify_aud": False,
                "verify_iss": False,
            },
        )
        return payload.get("sub")
    except Exception:
        return None


async def connect(room_id: str, websocket: WebSocket):
    """Accept a WebSocket connection and register it for the given room."""
    await websocket.accept()
    if room_id not in _connections:
        _connections[room_id] = set()
    _connections[room_id].add(websocket)


def disconnect(room_id: str, websocket: WebSocket):
    """Remove a WebSocket connection from the room's connection pool."""
    if room_id in _connections:
        _connections[room_id].discard(websocket)
        if not _connections[room_id]:
            del _connections[room_id]


async def broadcast_room_update(room_id: str, event_type: str, data: dict = None):
    """Broadcast an update to all WebSocket clients connected to a room."""
    if room_id not in _connections:
        return
    message = json.dumps({"type": event_type, "data": data or {}}, default=str)
    dead = []
    for ws in _connections[room_id]:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _connections[room_id].discard(ws)


async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """WebSocket endpoint handler for room real-time updates."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    user_id = await verify_ws_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Note: membership check happens at HTTP level, WS trusts the token
    await connect(room_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive, ignore client messages
    except WebSocketDisconnect:
        disconnect(room_id, websocket)
    except Exception:
        disconnect(room_id, websocket)
