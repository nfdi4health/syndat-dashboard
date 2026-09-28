"""Run a smoke test against the locally built Docker Compose deployment."""

import json
import os
import subprocess
import time
from contextlib import closing
from urllib.error import URLError
from urllib.request import Request, urlopen


COMPOSE_FILE = "docker-compose.local.yml"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
TIMEOUT_SECONDS = int(os.getenv("SYSTEM_TEST_TIMEOUT", "180"))


def fetch(url: str) -> tuple[int, str]:
    request = Request(url, headers={"Accept": "application/json"})
    with closing(urlopen(request, timeout=5)) as response:
        return response.status, response.read().decode("utf-8")


def wait_for(url: str, deadline: float) -> tuple[int, str]:
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            return fetch(url)
        except (OSError, URLError) as error:
            last_error = error
            time.sleep(2)
    raise RuntimeError(f"Timed out waiting for {url}: {last_error}") from last_error


def assert_backend_contract() -> None:
    status, body = fetch(f"{BACKEND_URL}/version")
    assert status == 200
    assert body.strip('"') == "1.0.0"

    status, body = fetch(f"{BACKEND_URL}/datasets")
    assert status == 200
    datasets = json.loads(body)
    assert "test" in datasets


def assert_frontend_contract() -> None:
    status, body = fetch(FRONTEND_URL)
    assert status == 200
    assert '<div id="root">' in body


def main() -> None:
    command = ["docker", "compose", "-f", COMPOSE_FILE, "up", "--build", "-d"]
    subprocess.run(command, check=True)
    try:
        deadline = time.monotonic() + TIMEOUT_SECONDS
        wait_for(f"{BACKEND_URL}/version", deadline)
        wait_for(FRONTEND_URL, deadline)
        assert_backend_contract()
        assert_frontend_contract()
        print("Docker Compose system smoke test passed.")
    finally:
        subprocess.run(
            ["docker", "compose", "-f", COMPOSE_FILE, "down", "--remove-orphans"],
            check=False,
        )


if __name__ == "__main__":
    main()
