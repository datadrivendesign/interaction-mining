"""
export_doc_pdf.py — Convert a Markdown file to a crisp PDF via Chrome headless.

Usage:
    python3 export_doc_pdf.py <input.md> [<output.pdf>]

If output path is omitted, the PDF is written next to the input file.
Requires Google Chrome (already required for the platform itself).
"""

import argparse
import sys
import tempfile
from pathlib import Path

import markdown
from playwright.sync_api import sync_playwright


# ---------------------------------------------------------------------------
# HTML wrapper
# ---------------------------------------------------------------------------

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {{
    margin: 22mm 25mm;
  }}

  * {{
    box-sizing: border-box;
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #18181b;
    max-width: 100%;
  }}

  h1 {{
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
    color: #18181b;
  }}

  h2 {{
    font-size: 16px;
    font-weight: 700;
    margin: 28px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e4e4e7;
    color: #18181b;
  }}

  h3 {{
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #52525b;
    margin: 22px 0 8px;
  }}

  p {{
    margin: 0 0 10px;
  }}

  a {{
    color: #6366f1;
    word-break: break-all;
  }}

  strong {{
    font-weight: 600;
  }}

  em {{
    font-style: italic;
    color: #71717a;
  }}

  hr {{
    border: none;
    border-top: 1px solid #e4e4e7;
    margin: 18px 0;
  }}

  /* Ordered & unordered lists */
  ol, ul {{
    margin: 0 0 10px 0;
    padding-left: 20px;
  }}

  li {{
    margin-bottom: 5px;
  }}

  /* Numbered list used for videos — give the URL breathing room */
  ol li p {{
    margin: 0;
  }}

  ol li a {{
    display: block;
    font-size: 11px;
    margin-top: 1px;
    color: #6366f1;
  }}

  /* Tables */
  table {{
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 12px;
    font-size: 12px;
  }}

  th {{
    background: #f4f4f5;
    font-weight: 600;
    text-align: left;
    padding: 6px 10px;
    border: 1px solid #e4e4e7;
  }}

  td {{
    padding: 5px 10px;
    border: 1px solid #e4e4e7;
    vertical-align: top;
    word-break: break-word;
  }}

  /* Inline code */
  code {{
    background: #f4f4f5;
    border-radius: 3px;
    padding: 1px 5px;
    font-family: "SF Mono", "Fira Mono", monospace;
    font-size: 11.5px;
  }}
</style>
</head>
<body>
{body}
</body>
</html>"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(args: argparse.Namespace) -> None:
    input_path = Path(args.input)
    if not input_path.exists():
        sys.exit(f"File not found: {input_path}")

    output_path = Path(args.output) if args.output else input_path.with_suffix(".pdf")

    # Convert markdown → HTML body
    md_text = input_path.read_text(encoding="utf-8")
    body_html = markdown.markdown(
        md_text,
        extensions=["tables", "nl2br", "sane_lists"],
    )
    full_html = HTML_TEMPLATE.format(body=body_html)

    with tempfile.NamedTemporaryFile(suffix=".html", mode="w",
                                     encoding="utf-8", delete=False) as f:
        f.write(full_html)
        tmp_html = Path(f.name)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(tmp_html.as_uri(), wait_until="networkidle")
            page.pdf(
                path=str(output_path.resolve()),
                format="Letter",
                margin={"top": "22mm", "bottom": "22mm",
                        "left": "25mm", "right": "25mm"},
                print_background=True,
            )
            browser.close()
    finally:
        tmp_html.unlink(missing_ok=True)

    print(f"Written → {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Path to the input Markdown file.")
    parser.add_argument("output", nargs="?", help="Path for the output PDF (optional).")
    main(parser.parse_args())
