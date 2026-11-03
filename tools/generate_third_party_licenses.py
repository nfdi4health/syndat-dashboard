#!/usr/bin/env python3
"""Regenerate the third-party attribution files.

Outputs:
  backend/credits/THIRD_PARTY_LICENSES.txt   full license texts shipped in the
                                             backend container image
  frontend/public/third-party-licenses.txt   full license texts served with the
                                             frontend build

Requires the backend virtualenv (backend/.venv) and the frontend dependencies
(frontend/node_modules) to be installed, since license metadata is read from
the installed distributions.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENV_GLOBS = ("backend/.venv/lib/python3*/site-packages", "backend/.venv/lib/site-packages")
FRONTEND = ROOT / "frontend"
LICENSE_FILE_RE = re.compile(r"^(licen[cs]e|copying|copyright|unlicen[cs]e)", re.IGNORECASE)
NOTICE_FILE_RE = re.compile(r"^notice", re.IGNORECASE)

SPDX_ALIASES = {
    "mit license": "MIT",
    "the mit license (mit)": "MIT",
    "bsd 3-clause license": "BSD-3-Clause",
    "bsd": "BSD-3-Clause",
    "bsd-3-clause": "BSD-3-Clause",
    "3-clause bsd": "BSD-3-Clause",
    "bsd-2-clause": "BSD-2-Clause",
    "2-clause bsd": "BSD-2-Clause",
    "apache software license": "Apache-2.0",
    "apache-2.0": "Apache-2.0",
    "apache 2.0": "Apache-2.0",
    "mpl-2.0": "MPL-2.0",
    "mozilla public license 2.0": "MPL-2.0",
    "isc": "ISC",
    "isc license": "ISC",
    "the clear bsd license": "BSD-3-Clause-Clear",
    "psf-2.0": "PSF-2.0",
    "python software foundation license": "PSF-2.0",
    "mit-cmu": "MIT-CMU",
    "cc0-1.0": "CC0-1.0",
    "unlicense": "Unlicense",
    "dual license": "MIT",
}

SPDX_TEXTS = {
    "Apache-2.0": (ROOT / "frontend/node_modules/typescript/LICENSE"),
    "MIT": None,
    "ISC": None,
    "BSD-2-Clause": None,
    "BSD-3-Clause": None,
    "CC0-1.0": None,
}

SHORT_TEXTS = {
    "MIT": (
        "Permission is hereby granted, free of charge, to any person obtaining a copy\n"
        "of this software and associated documentation files (the \"Software\"), to deal\n"
        "in the Software without restriction, including without limitation the rights\n"
        "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n"
        "copies of the Software, and to permit persons to whom the Software is\n"
        "furnished to do so, subject to the following conditions:\n\n"
        "The above copyright notice and this permission notice shall be included in all\n"
        "copies or substantial portions of the Software.\n\n"
        "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n"
        "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n"
        "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n"
        "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n"
        "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n"
        "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n"
        "SOFTWARE."
    ),
    "ISC": (
        "Permission to use, copy, modify, and/or distribute this software for any\n"
        "purpose with or without fee is hereby granted, provided that the above\n"
        "copyright notice and this permission notice appear in all copies.\n\n"
        "THE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\n"
        "WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF\n"
        "MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR\n"
        "ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES\n"
        "WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN\n"
        "ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF\n"
        "OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE."
    ),
    "BSD-2-Clause": (
        "Redistribution and use in source and binary forms, with or without\n"
        "modification, are permitted provided that the following conditions are met:\n\n"
        "1. Redistributions of source code must retain the above copyright notice,\n"
        "   this list of conditions and the following disclaimer.\n\n"
        "2. Redistributions in binary form must reproduce the above copyright notice,\n"
        "   this list of conditions and the following disclaimer in the documentation\n"
        "   and/or other materials provided with the distribution.\n\n"
        "THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\"\n"
        "AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n"
        "IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\n"
        "ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE\n"
        "LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR\n"
        "CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF\n"
        "SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS\n"
        "INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN\n"
        "CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)\n"
        "ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE\n"
        "POSSIBILITY OF SUCH DAMAGE."
    ),
    "BSD-3-Clause": (
        "Redistribution and use in source and binary forms, with or without\n"
        "modification, are permitted provided that the following conditions are met:\n\n"
        "1. Redistributions of source code must retain the above copyright notice,\n"
        "   this list of conditions and the following disclaimer.\n\n"
        "2. Redistributions in binary form must reproduce the above copyright notice,\n"
        "   this list of conditions and the following disclaimer in the documentation\n"
        "   and/or other materials provided with the distribution.\n\n"
        "3. Neither the name of the copyright holder nor the names of its\n"
        "   contributors may be used to endorse or promote products derived from this\n"
        "   software without specific prior written permission.\n\n"
        "THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\"\n"
        "AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n"
        "IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\n"
        "ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE\n"
        "LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR\n"
        "CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF\n"
        "SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS\n"
        "INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN\n"
        "CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)\n"
        "ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE\n"
        "POSSIBILITY OF SUCH DAMAGE."
    ),
    "CC0-1.0": (
        "This work is dedicated to the public domain under the Creative Commons\n"
        "CC0 1.0 Universal Public Domain Dedication. See\n"
        "https://creativecommons.org/publicdomain/zero/1.0/legalcode for the full\n"
        "legal text."
    ),
}


def site_packages() -> Path | None:
    for pattern in VENV_GLOBS:
        matches = sorted(ROOT.glob(pattern))
        if matches:
            return matches[0]
    return None


def normalize_license(raw: str, classifiers: list[str], texts: list[str]) -> str:
    raw = (raw or "").strip()
    if raw and raw.lower() not in {"unknown", "unlicensed", "public domain"}:
        lowered = raw.lower()
        if lowered in SPDX_ALIASES:
            return SPDX_ALIASES[lowered]
        if lowered == "bsd license":
            raw = ""
        elif re.fullmatch(r"[A-Za-z0-9.+-]+( (OR|AND) [A-Za-z0-9.+-]+)*", raw):
            return raw
        if len(raw) > 60:
            lowered = raw.splitlines()[0].lower()
            if lowered in SPDX_ALIASES:
                return SPDX_ALIASES[lowered]
    for classifier in classifiers:
        match = re.search(r"License :: OSI Approved :: (.+?) License", classifier)
        if match:
            name = match.group(1).strip().lower()
            return SPDX_ALIASES.get(name, SPDX_ALIASES.get(f"{name} license", name))
    joined = "\n".join(texts).lower()
    signals = [
        ("Apache License", "Apache-2.0"),
        ("mit license", "MIT"),
        ("permission is hereby granted, free of charge", "MIT"),
        ("bsd 3-clause", "BSD-3-Clause"),
        ("neither the name of", "BSD-3-Clause"),
        ("redistribution and use in source and binary forms", "BSD-3-Clause"),
        ("mozilla public license", "MPL-2.0"),
        ("permission to use, copy, modify, and/or distribute", "ISC"),
        ("creative commons zero", "CC0-1.0"),
    ]
    for needle, identifier in signals:
        if needle.lower() in joined:
            return identifier
    return "UNKNOWN"


def license_texts(package_dir: Path) -> list[str]:
    texts: list[str] = []
    if not package_dir.is_dir():
        return texts
    for candidate in sorted(package_dir.iterdir()):
        if candidate.is_file() and (
            LICENSE_FILE_RE.match(candidate.name) or NOTICE_FILE_RE.match(candidate.name)
        ):
            texts.append(f"[{candidate.name}]\n{candidate.read_text(errors='ignore').strip()}")
    return texts


def resolve_text(identifier: str, texts: list[str]) -> str:
    if texts:
        return "\n\n".join(texts)
    if identifier in SHORT_TEXTS:
        return f"Full license text ({identifier}):\n\n{SHORT_TEXTS[identifier]}"
    apache = SPDX_TEXTS.get(identifier)
    if apache and apache.exists():
        return apache.read_text(errors="ignore").strip()
    return ""


def backend_packages() -> list[dict[str, str]]:
    packages: list[dict[str, str]] = []
    sp = site_packages()
    if sp is None:
        print("warning: backend virtualenv not found, skipping backend packages")
        return packages
    for dist_info in sorted(sp.glob("*.dist-info")):
        body = (dist_info / "METADATA").read_text(errors="ignore")
        meta: dict[str, str] = {}
        classifiers: list[str] = []
        for line in body.splitlines():
            if line.startswith("Classifier: License ::"):
                classifiers.append(line.split(": ", 1)[1])
            elif ": " in line and not line.startswith((" ", "\t")):
                key, value = line.split(": ", 1)
                meta.setdefault(key, value)
        name = meta.get("Name", dist_info.name)
        texts: list[str] = []
        for candidate in sorted(dist_info.rglob("*")):
            if candidate.is_file() and (
                LICENSE_FILE_RE.match(candidate.name) or NOTICE_FILE_RE.match(candidate.name)
            ):
                texts.append(f"[{candidate.name}]\n{candidate.read_text(errors='ignore').strip()}")
        inline = re.search(r"^License: (.*?)(?=^\S[^\n]*: |\Z)", body, re.M | re.S)
        if inline and len(inline.group(1).strip()) > 120:
            texts.append(f"[METADATA License]\n{inline.group(1).strip()}")
        identifier = normalize_license(meta.get("License-Expression") or meta.get("License", ""), classifiers, texts)
        packages.append(
            {
                "name": name,
                "version": meta.get("Version", ""),
                "license": identifier,
                "text": resolve_text(identifier, texts),
            }
        )
    return packages


def frontend_packages() -> list[dict[str, str]]:
    lock = FRONTEND / "package-lock.json"
    if not lock.exists():
        print("warning: frontend/package-lock.json not found, skipping frontend packages")
        return []
    data = json.loads(lock.read_text())
    packages: list[dict[str, str]] = []
    for key, entry in data.get("packages", {}).items():
        if not key.startswith("node_modules/") or entry.get("dev"):
            continue
        name = entry.get("name") or key[len("node_modules/"):]
        package_dir = FRONTEND / key
        texts = license_texts(package_dir)
        declared = None
        manifest = package_dir / "package.json"
        if manifest.exists():
            declared = json.loads(manifest.read_text(errors="ignore")).get("license")
        raw = declared or entry.get("license") or ""
        if isinstance(raw, dict):
            raw = raw.get("type", "")
        identifier = normalize_license(str(raw), [], texts)
        packages.append(
            {
                "name": name,
                "version": entry.get("version", ""),
                "license": identifier,
                "text": resolve_text(identifier, texts),
            }
        )
    return sorted(packages, key=lambda p: (p["name"].lower(), p["version"]))


def write_full_texts(path: Path, title: str, packages: list[dict], header_note: str) -> None:
    lines = [title, "=" * len(title), "", header_note, ""]
    for pkg in packages:
        lines.append("-" * 78)
        lines.append(f"{pkg['name']} {pkg['version']} ({pkg['license']})")
        lines.append("-" * 78)
        if pkg["text"]:
            lines.append(pkg["text"])
        else:
            lines.append("No license text was shipped with this package.")
            lines.append(f"Licensed under: {pkg['license']} - see https://spdx.org/licenses/")
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n")


def main() -> None:
    backend = backend_packages()
    frontend = frontend_packages()
    write_full_texts(
        ROOT / "backend/credits/THIRD_PARTY_LICENSES.txt",
        "Third-party licenses - backend",
        backend,
        "Generated by tools/generate_third_party_licenses.py. "
        "Includes every Python distribution installed into the backend image.",
    )
    write_full_texts(
        FRONTEND / "public/third-party-licenses.txt",
        "Third-party licenses - frontend",
        frontend,
        "Generated by tools/generate_third_party_licenses.py. "
        "Includes the production dependencies bundled into the frontend build.",
    )
    print(f"backend packages: {len(backend)}, frontend packages: {len(frontend)}")


if __name__ == "__main__":
    main()
