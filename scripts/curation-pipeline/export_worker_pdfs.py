"""
export_worker_pdfs.py — Convert worker assignment JSON files to printable PDFs.

Reads every worker-XX.json in the assignments directory and writes a
worker-XX.pdf alongside it. Each PDF lists the worker's assigned apps with
their tasks as a numbered list, an App Store link, and an interactive
Done checkbox per app.

Requires:
    pip install reportlab Pillow

Usage:
    python3 export_worker_pdfs.py [--input-dir DIR] [--output-dir DIR]
"""

import argparse
import json
import sys
import traceback
from io import BytesIO
from pathlib import Path
import urllib.request

try:
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.utils import ImageReader
except ImportError:
    sys.exit("Install reportlab: pip install reportlab Pillow")

INPUT_DIR_DEFAULT  = Path(__file__).parent / "worker-assignments"
OUTPUT_DIR_DEFAULT = Path(__file__).parent / "worker-assignments"

# ── Page geometry ─────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = letter     # 612 × 792 pt
MX = 28                     # horizontal margin
MY = 14                     # vertical margin
CW = PAGE_W - 2 * MX       # content width  (~556 pt)

# ── Colors ────────────────────────────────────────────────────────────────────
C_DARK       = colors.HexColor('#18181b')
C_DARK_MED   = colors.HexColor('#3f3f46')
C_BORDER     = colors.HexColor('#e4e4e7')
C_CARD_BG    = colors.HexColor('#f4f4f5')
C_ACCENT     = colors.HexColor('#6366f1')
C_MUTED      = colors.HexColor('#a1a1aa')
C_TEXT_DIM   = colors.HexColor('#71717a')
C_TEXT       = colors.HexColor('#27272a')
C_BADGE_BG   = colors.HexColor('#fef3c7')
C_BADGE_BD   = colors.HexColor('#fde68a')
C_BADGE_TEXT = colors.HexColor('#92400e')

# ── Card geometry ─────────────────────────────────────────────────────────────
BAND_H      = 48    # top dark header band
CARD_HDR_H  = 52    # each app card's header row
ICON_SZ     = 30    # icon square (pt)
CARD_R      = 5     # card corner radius
CARD_GAP    = 12    # vertical gap between cards
TASK_H      = 14    # height per task row
TASK_PAD    = 9     # top/bottom padding in task list
TASK_GAP    = 4     # gap between task rows
CB_SIZE     = 12    # checkbox size
TASK_NUM_W  = 14    # width reserved for "N." prefix
TASK_X_OFF  = 10    # task list left offset inside card
BADGE_W     = 58    # approximate pt width of AI-generated badge


def _card_h(n: int) -> float:
    return CARD_HDR_H + TASK_PAD * 2 + n * TASK_H + max(0, n - 1) * TASK_GAP


def _fetch_icon(url: str) -> "ImageReader | None":
    if not url:
        return None
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            return ImageReader(BytesIO(r.read()))
    except Exception:
        return None


# ── PDF builder ───────────────────────────────────────────────────────────────

class WorkerPDF:
    def __init__(self, path: Path, worker_id: str, n_apps: int):
        self._c    = rl_canvas.Canvas(str(path), pagesize=letter)
        self._wid  = worker_id.upper().replace("-", " ")
        self._napp = n_apps
        self._fidx = 0
        self._new_page(first=True)

    def _new_page(self, first: bool = False) -> None:
        if not first:
            self._c.showPage()
        self._draw_band()
        self._y = PAGE_H - BAND_H - MY

    def _draw_band(self) -> None:
        c = self._c
        c.setFillColor(C_DARK)
        c.rect(0, PAGE_H - BAND_H, PAGE_W, BAND_H, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MX, PAGE_H - 22, "INTERACTION MINING — TASK ASSIGNMENT")
        c.setFont("Helvetica", 8)
        c.setFillColor(C_MUTED)
        c.drawString(MX, PAGE_H - 34, "https://www.interactionmining.org/  ·  Use Google Chrome")
        badge   = f"{self._wid}  ·  {self._napp} apps"
        badge_w = c.stringWidth(badge, "Helvetica-Bold", 8) + 20
        bx      = PAGE_W - MX - badge_w
        by      = PAGE_H - 38
        c.setFillColor(C_DARK_MED)
        c.roundRect(bx, by, badge_w, 18, 9, fill=1, stroke=0)
        c.setFillColor(colors.HexColor('#e4e4e7'))
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(bx + badge_w / 2, by + 5, badge)

    def _placeholder_icon(self, x: float, y: float) -> None:
        c = self._c
        c.setFillColor(colors.HexColor('#d4d4d8'))
        c.setStrokeColor(C_BORDER)
        c.roundRect(x, y, ICON_SZ, ICON_SZ, 4, fill=1, stroke=1)

    def add_app(self, app: dict, icon: "ImageReader | None") -> None:
        tasks = app.get("tasks") or app.get("selected", [])
        ch    = _card_h(len(tasks))

        if self._y - ch < MY + 30:
            self._new_page()

        c      = self._c
        cx, cy = MX, self._y - ch   # card bottom-left
        self._fidx += 1
        name = app.get("appName", "Unknown App")

        # ── Card background + border ──────────────────────────────────────────
        c.setFillColor(colors.white)
        c.setStrokeColor(C_BORDER)
        c.roundRect(cx, cy, CW, ch, CARD_R, fill=1, stroke=1)

        # ── App header band (gray fill, clipped visually by border redraw) ────
        hdr_y = cy + ch - CARD_HDR_H
        c.setFillColor(C_CARD_BG)
        c.rect(cx, hdr_y, CW, CARD_HDR_H, fill=1, stroke=0)

        # Divider line
        c.setStrokeColor(C_BORDER)
        c.line(cx, hdr_y, cx + CW, hdr_y)

        # Redraw border on top so rounded corners cover the gray rect overflow
        c.setStrokeColor(C_BORDER)
        c.roundRect(cx, cy, CW, ch, CARD_R, fill=0, stroke=1)

        # ── Icon ──────────────────────────────────────────────────────────────
        icon_x = cx + TASK_X_OFF
        icon_y = hdr_y + (CARD_HDR_H - ICON_SZ) / 2
        if icon:
            try:
                c.drawImage(icon, icon_x, icon_y, ICON_SZ, ICON_SZ,
                            preserveAspectRatio=True, mask='auto')
            except Exception:
                self._placeholder_icon(icon_x, icon_y)
        else:
            self._placeholder_icon(icon_x, icon_y)

        # ── App name + category ───────────────────────────────────────────────
        tx   = icon_x + ICON_SZ + 8
        midh = hdr_y + CARD_HDR_H / 2
        c.setFillColor(C_TEXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(tx, midh + 3, name[:50])
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_DIM)
        c.drawString(tx, midh - 8, app.get("category", "").upper()[:45])

        # ── Interactive Done checkbox (far right of header) ───────────────────
        cb_x = cx + CW - TASK_X_OFF - CB_SIZE
        cb_y = hdr_y + (CARD_HDR_H - CB_SIZE) / 2
        c.setFont("Helvetica-Bold", 6)
        c.setFillColor(C_MUTED)
        c.drawCentredString(cb_x + CB_SIZE / 2, cb_y + CB_SIZE + 3, "DONE")
        c.acroForm.checkbox(
            name=f'done_{self._fidx}',
            tooltip=f'Mark {name[:40]} as done',
            x=cb_x, y=cb_y,
            size=CB_SIZE,
            checked=False,
            buttonStyle='check',
            borderColor=C_MUTED,
            fillColor=colors.white,
            textColor=C_TEXT,
            borderWidth=1.5,
            borderStyle='solid',
            forceBorder=True,
        )

        # ── App Store link (left of checkbox) ─────────────────────────────────
        store_url = app.get("appStoreUrl") or app.get("meta", {}).get("url", "")
        if store_url:
            link_text = "App Store ↗"
            c.setFont("Helvetica", 7.5)
            lw = c.stringWidth(link_text, "Helvetica", 7.5)
            lx = cb_x - 8 - lw
            ly = hdr_y + (CARD_HDR_H - 7.5) / 2
            c.setFillColor(C_ACCENT)
            c.drawString(lx, ly, link_text)
            c.linkURL(store_url, (lx, ly - 2, lx + lw, ly + 9), relative=0)

        # ── Task list ─────────────────────────────────────────────────────────
        # Available width for task text: card width minus left offset, num prefix, right margin
        text_x    = cx + TASK_X_OFF + TASK_NUM_W
        text_avail = CW - TASK_X_OFF - TASK_NUM_W - TASK_X_OFF   # ~504 pt

        for i, task in enumerate(tasks):
            text = task.get("task", "")
            gen  = task.get("generated", False)
            ry   = hdr_y - TASK_PAD - (i + 1) * TASK_H - i * TASK_GAP

            # Task number
            c.setFont("Helvetica-Bold", 8.5)
            c.setFillColor(C_ACCENT)
            c.drawString(cx + TASK_X_OFF, ry, f"{i + 1}.")

            # Task text — truncate if too wide (rare at 100-char limit)
            max_w = text_avail - (BADGE_W + 4 if gen else 0)
            display = text
            c.setFont("Helvetica", 8.5)
            while display and c.stringWidth(display, "Helvetica", 8.5) > max_w:
                display = display[:-1]
            if display != text:
                display = display.rstrip() + "…"
            c.setFillColor(C_TEXT)
            c.drawString(text_x, ry, display)

            # AI-generated badge
            if gen:
                btext  = "AI-generated"
                bfsz   = 6.5
                bw     = c.stringWidth(btext, "Helvetica-Bold", bfsz) + 8
                bx_pos = text_x + c.stringWidth(display, "Helvetica", 8.5) + 4
                by_pos = ry - 1
                c.setFillColor(C_BADGE_BG)
                c.setStrokeColor(C_BADGE_BD)
                c.roundRect(bx_pos, by_pos, bw, 9, 2, fill=1, stroke=1)
                c.setFillColor(C_BADGE_TEXT)
                c.setFont("Helvetica-Bold", bfsz)
                c.drawString(bx_pos + 4, by_pos + 1.5, btext)

        self._y -= ch + CARD_GAP

    def save(self) -> None:
        c = self._c
        footer = (
            "Tasks marked AI-generated are suggested based on the app description — complete them "
            "if achievable, or skip and note it. For named items no longer available, use a similar one. "
            "Use Google Chrome for best compatibility. Questions? Reply to this email."
        )
        c.setFont("Helvetica", 7)
        c.setFillColor(C_MUTED)
        fy    = MY + 14
        line  = ""
        for word in footer.split():
            test = (line + " " + word).strip()
            if c.stringWidth(test, "Helvetica", 7) < CW:
                line = test
            else:
                c.drawString(MX, fy, line)
                fy -= 9
                line = word
        if line:
            c.drawString(MX, fy, line)
        c.save()


# ── Build ─────────────────────────────────────────────────────────────────────

def build_pdf(worker: dict, out: Path) -> None:
    worker_id = worker.get("workerId", "worker")
    apps      = worker.get("apps", [])

    def _icon_url(app: dict) -> str:
        return (app.get("icon") or app.get("meta", {}).get("icon") or "").strip()

    icons: dict[str, "ImageReader | None"] = {}
    for app in apps:
        url = _icon_url(app)
        if url and url not in icons:
            icons[url] = _fetch_icon(url)

    pdf = WorkerPDF(out, worker_id, len(apps))
    for app in apps:
        pdf.add_app(app, icons.get(_icon_url(app)))
    pdf.save()


def main(args: argparse.Namespace) -> None:
    input_dir  = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    worker_files = sorted(input_dir.glob("worker-*.json"))
    if not worker_files:
        print(f"No worker-XX.json files found in {input_dir}")
        return

    print(f"Exporting {len(worker_files)} worker PDFs → {output_dir}")
    for path in worker_files:
        with open(path) as f:
            worker = json.load(f)
        out = output_dir / (path.stem + ".pdf")
        try:
            build_pdf(worker, out)
            n = worker.get("appCount", len(worker.get("apps", [])))
            print(f"  ✓ {path.name} → {out.name}  ({n} apps)")
        except Exception as exc:
            print(f"  ✗ {path.name} failed: {exc}", file=sys.stderr)
            traceback.print_exc()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir",  default=str(INPUT_DIR_DEFAULT))
    parser.add_argument("--output-dir", default=str(OUTPUT_DIR_DEFAULT))
    args = parser.parse_args()
    main(args)
