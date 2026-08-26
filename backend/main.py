import os
import asyncio
import re
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from BinaryOptionsToolsV2 import PocketOptionAsync


load_dotenv()

app = FastAPI(
    title="PO BOT PRO Demo Backend",
    version="1.0.0",
)


client: Optional[PocketOptionAsync] = None
client_lock = asyncio.Lock()


class ConnectRequest(BaseModel):
    ssid: str


def validate_demo_ssid(ssid: str) -> bool:
    """
    Accept the full Pocket Option auth frame.

    Expected general format:
    42["auth",{...}]
    """

    if not ssid:
        return False

    ssid = ssid.strip()

    if not ssid.startswith('42["auth"'):
        return False

    # Basic safety check:
    # The SSID must explicitly contain isDemo:1.
    if '"isDemo":1' not in ssid and '"isDemo": 1' not in ssid:
        return False

    return True


async def close_client():
    global client

    if client is not None:
        try:
            await client.shutdown()
        except Exception:
            pass

    client = None


@app.get("/")
async def root():
    return {
        "ok": True,
        "service": "PO BOT PRO Demo Backend",
        "mode": "DEMO_ONLY",
    }


@app.get("/health")
async def health():
    connected = False

    if client is not None:
        try:
            connected = bool(client.is_connected())
        except Exception:
            connected = False

    return {
        "ok": True,
        "connected": connected,
        "mode": "DEMO_ONLY",
    }


@app.post("/connect")
async def connect(request: ConnectRequest):
    global client

    ssid = request.ssid.strip()

    if not validate_demo_ssid(ssid):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid SSID. A full Pocket Option Demo "
                'auth frame beginning with 42["auth" and '
                "containing isDemo:1 is required."
            ),
        )

    async with client_lock:
        await close_client()

        try:
            new_client = await PocketOptionAsync(ssid)

            # Allow the client time to initialize.
            await asyncio.sleep(2)

            # HARD DEMO CHECK.
            if not new_client.is_demo():
                await new_client.shutdown()

                raise HTTPException(
                    status_code=403,
                    detail="REAL account detected. Only DEMO accounts are allowed.",
                )

            balance = await new_client.balance()

            client = new_client

            return {
                "ok": True,
                "connected": True,
                "account": "DEMO",
                "balance": float(balance),
            }

        except HTTPException:
            raise

        except Exception as exc:
            await close_client()

            raise HTTPException(
                status_code=502,
                detail=f"Pocket Option connection failed: {str(exc)}",
            )


@app.post("/disconnect")
async def disconnect():
    async with client_lock:
        await close_client()

    return {
        "ok": True,
        "connected": False,
    }


@app.get("/balance")
async def get_balance():
    if client is None:
        raise HTTPException(
            status_code=401,
            detail="Not connected.",
        )

    try:
        if not client.is_demo():
            await close_client()

            raise HTTPException(
                status_code=403,
                detail="REAL account detected. Connection blocked.",
            )

        balance = await client.balance()

        return {
            "ok": True,
            "account": "DEMO",
            "balance": float(balance),
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to read balance: {str(exc)}",
        )
