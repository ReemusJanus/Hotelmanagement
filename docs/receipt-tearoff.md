# Receipt tear-off spacing — 15 November 2026

Scope: trailing paper space only. Default 15mm, adjustable 0–30mm in “80 mm printer settings”. Existing width and fixed-driver preferences survive the one-time migration to the new browser preference key. Subsequent custom feed choices persist.

The shared footer owns the trailing padding and avoids splitting, keeping the last line and tear-off space together. Existing page-height measurement includes this padding. Portrait handling, 72mm default printable width, billing and backend remain unchanged. No raw ESC/POS commands are sent. Physical feed/cutter behavior remains driver-controlled.

Files: ThermalReceipt.jsx, receipt-model.mjs, thermal-base.css, receipt.test.mjs, thermal.browser.cjs.

Validation: 12 unit/API tests passed; frontend build passed. Chrome fixture checks cover old-preference migration, 15mm footer padding, configurable saved 7mm padding, duplicate print prevention and print cleanup. 1/5/20/100-item receipts each occupy one upright 80mm page with no extra blank pages. PDF bottom whitespace is approximately 15.7–16.7mm including font leading/measurement rounding. Fixed-form 80x200mm fallback has three nonempty pages for the long test; the driver's fixed final-page remainder cannot be removed by web CSS. No physical printer testing was performed.

Deployment: staging frontend only using the existing deploy script. Release commit and tested artifact hashes are published in staging /release.json after verification. Production and backend are unchanged.

## Follow-up: short feed and post-print alarm

Confirmed model: **SHREYANS SRS89C-U**. Before editing, staging release metadata reported `030e086`, already containing the 15mm layout fix. The default is now 20mm (still adjustable 0–30mm). Existing v2 custom settings remain intact; the new **Use 20 mm tear-off space** button updates an existing browser explicitly. Portrait, 72mm width, isolation, page measurement and all financial calculations remain unchanged.

Root-cause boundary: CSS reserves document whitespace, not physical motor feed. Driver blank-tail trimming, fixed paper forms or device feed/cutter positioning can override it; none is confirmed as the cause on this Windows installation. The browser cannot guarantee the text clears a particular tear edge or issue raw USB/ESC/POS commands. No cutter/feed commands were added. A verified model-specific command/error table was not located, so automatic-cut capability/command compatibility and red-light/beep meaning are not certified here.

Checks: 12 unit/API tests pass; frontend build passes. Chrome fixtures pass for 1/5/20/100 items, double-click suppression, two additional independent jobs per receipt, custom 7mm spacing, 20mm preset, and Admin parcel reprints. Measured PDFs are single upright 80mm pages, approximately 20.7–21.7mm from last printed text to the end (20mm padding plus font spacing and rounding). Fixed-form fallback produces nonempty pages, but its last fixed page can retain unused length. Windows/Edge and physical USB/cutter testing remain pending.

Windows operator checks:
- Use the vendor-confirmed SRS89C-U Windows receipt driver and correct USB port; 80mm continuous receipt paper, Portrait, 100% scale, one copy, minimum/no margins and browser headers/footers off. Keep the app at 72mm content width.
- Compare the browser preview with the physical output. If preview spacing is present but physical feed is not, ask the vendor how this driver handles blank-tail reduction, end-of-document feed and tear-off/cutter position. Use supported driver controls only; do not add arbitrary cutter codes or a large fixed A4/Letter form. Avoid stacking unnecessary driver feed on top of effective app spacing.
- Print a Windows test page twice: Settings → Bluetooth & devices → Printers & scanners → printer → Printer properties → General → Print Test Page. Record whether either causes red light/beeps and whether the paper cuts automatically. These results have not been supplied.
- If the fault also occurs outside KnockOUT, investigate driver/device first. Clear failed jobs, check paper and closed cover without forcing a cutter, and use vendor support for persistent alarms. Do not suppress an alarm as a substitute for diagnosis.

Verified Windows procedure: https://support.microsoft.com/en-gb/windows/hardware/printer/fix-printing-problems-in-word-excel-or-other-apps?nochrome=true . Queue recovery: https://support.microsoft.com/en-us/windows/hardware/printer/fix-print-spooler-service-not-running-errors-in-windows . Manufacturer contact/driver entry point: https://www.shreyanspos.com/ (not a verified model-specific error-code manual).
