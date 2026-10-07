# PMS handover documentation

Start with **Hotel_Management_System_Complete_Documentation.pdf** (92 pages). The matching Markdown is the editable source of truth. The PDF includes the architecture, ER and sequence diagrams; their Mermaid sources are retained separately.

- `VERIFICATION.md`: completed checks and explicit limits.
- `api-inventory.json`: 76 AST-extracted Express route handlers; supplemental routes are in the document.
- `database-inventory.json`: 25 runtime base CREATE definitions, not a live schema dump.
- `environment-inventory.json`: names/purposes/source locations, no private values.
- `source-manifest.json`: reviewed source hashes, excluding secrets and generated dependencies.

## Update the PDF

Edit the Markdown and rerun the renderer. Rendering is local and does not access the application/database. The renderer uses macOS system Arial/Courier New fonts; configure equivalent fonts in `render_pdf.py` on other platforms.

```bash
python3 -m venv /private/tmp/pms-docs-venv
/private/tmp/pms-docs-venv/bin/pip install -r requirements.txt
/private/tmp/pms-docs-venv/bin/python3 render_pdf.py
```

Run these commands from this folder. To refresh only the machine-readable route inventory after code changes:

```bash
node extract-inventory.cjs
```

This uses the installed mobile Babel parser. It does not rewrite the curated API prose. Reconcile source changes, regenerate manifests and inventories, update dates/version, inspect pages and repeat secret checks before publication. Generated response shapes are not runtime samples or an OpenAPI schema.

The handover distinguishes existing implementation from proposed operational controls. Backup, restore, deployment and load-test instructions were not executed during documentation.
