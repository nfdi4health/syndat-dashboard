# Third-party credits

License texts for third-party components that the backend depends on and does
not redistribute in a form that already carries their license file.

| Component | License | File |
| --- | --- | --- |
| `anonymeter` | Clear BSD (BSD-3-Clause-Clear) | [`anonymeter/LICENSE.md`](anonymeter/LICENSE.md) |
| `syndat` | MIT | [`syndat/LICENSE.md`](syndat/LICENSE.md) |

[`THIRD_PARTY_LICENSES.txt`](THIRD_PARTY_LICENSES.txt) contains the full license
texts of all Python packages installed in the backend image.

Do not edit the generated files by hand. Regenerate them from the repository
root with:

```bash
python3 tools/generate_third_party_licenses.py
```

The whole `credits` directory is copied into the backend image by
`backend/Dockerfile`.
