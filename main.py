"""
aiNarabic Newsletter Generator — Entry Point

Usage:
    python main.py                  # Print newsletter to console
    python main.py --save           # Also save to output/newsletter_YYYY-MM-DD.md
    python main.py --json           # Also save raw JSON items to output/
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

from newsletter_generator import generate_newsletter, format_newsletter_text


def parse_args():
    parser = argparse.ArgumentParser(description="Generate the aiNarabic weekly AI newsletter.")
    parser.add_argument("--save", action="store_true", help="Save newsletter markdown to output/")
    parser.add_argument("--json", action="store_true", help="Save raw JSON items to output/")
    return parser.parse_args()


def ensure_output_dir() -> Path:
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    return output_dir


def main():
    load_dotenv()

    args = parse_args()

    try:
        items = generate_newsletter()
    except EnvironmentError as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)

    if not items:
        print("\nNo newsletter items found. Try adjusting the search queries in config.py.")
        sys.exit(0)

    newsletter_text = format_newsletter_text(items)

    # Always print to console
    print("\n" + "=" * 60)
    print(newsletter_text)
    print("=" * 60 + "\n")

    if args.save or args.json:
        output_dir = ensure_output_dir()
        date_str = datetime.utcnow().strftime("%Y-%m-%d")

        if args.save:
            md_path = output_dir / f"newsletter_{date_str}.md"
            md_path.write_text(newsletter_text, encoding="utf-8")
            print(f"Newsletter saved to: {md_path}")

        if args.json:
            json_path = output_dir / f"newsletter_{date_str}.json"
            json_path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Raw JSON saved to: {json_path}")

    print(f"\nDone! {len(items)} items in this week's newsletter.")


if __name__ == "__main__":
    main()
