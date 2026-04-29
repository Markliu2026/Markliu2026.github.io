#!/usr/bin/env python3
"""
Auto-update script for Mark Liu's profile page.
Scrapes ITL website news pages and updates index.html with new relevant items.
Runs weekly via GitHub Actions.
"""

import re
import warnings
import sys
from datetime import datetime

import requests
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore")  # suppress SSL warnings

# ── Config ────────────────────────────────────────────────────────────────────
KEYWORDS = [
    "刘荣华", "Mark Liu",
    "泛家居", "装备制造事业部",
    "SAP.*峰会", "SAP.*论坛", "华为.*论坛", "华为.*峰会",
    "专精特新.*峰会", "供应链.*转型",
]

SOURCES = [
    ("https://www.itl.com.cn/company_news", "company"),
    ("https://www.itl.com.cn/project_news", "project"),
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}
# ─────────────────────────────────────────────────────────────────────────────


def fetch(url: str) -> BeautifulSoup | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=20, verify=False)
        r.encoding = "utf-8"
        return BeautifulSoup(r.text, "lxml")
    except Exception as exc:
        print(f"  [WARN] fetch failed: {url} — {exc}")
        return None


def is_relevant(text: str) -> bool:
    for kw in KEYWORDS:
        if re.search(kw, text):
            return True
    return False


def extract_items(soup: BeautifulSoup) -> list[dict]:
    """Try multiple common news-list selectors."""
    candidates = (
        soup.select("article")
        or soup.select(".news-item")
        or soup.select(".list-item")
        or soup.select("li.item")
        or soup.select(".post-item")
    )
    items = []
    for el in candidates:
        title_el = el.select_one("h2, h3, h4, .title, a[href]")
        date_el = el.select_one(".date, time, .time, .pub-date")
        desc_el = el.select_one(".desc, .summary, p")
        if not title_el:
            continue
        title = title_el.get_text(strip=True)
        date = date_el.get_text(strip=True) if date_el else ""
        desc = desc_el.get_text(strip=True) if desc_el else ""
        if title and is_relevant(title + desc):
            items.append({"title": title, "date": date, "desc": desc})
    return items


def get_existing_titles(html: str) -> set[str]:
    soup = BeautifulSoup(html, "lxml")
    titles = set()
    for el in soup.select(".news-title"):
        titles.add(el.get_text(strip=True))
    return titles


def format_date(raw: str) -> str:
    """Normalise date strings like '2025-04-10' → '2025.04'."""
    m = re.search(r"(\d{4})[.\-/](\d{1,2})", raw)
    if m:
        return f"{m.group(1)}.{m.group(2).zfill(2)}"
    m2 = re.search(r"(\d{4})", raw)
    if m2:
        return m2.group(1)
    return datetime.now().strftime("%Y.%m")


def build_news_html(item: dict) -> str:
    date_str = format_date(item.get("date", ""))
    title = item["title"]
    note = item.get("desc", "")
    note_html = f'\n          <div class="news-note">{note[:120]}</div>' if note else ""
    return (
        f'\n      <div class="news-item">\n'
        f'        <div class="news-date">{date_str}</div>\n'
        f'        <div class="news-content">\n'
        f'          <div class="news-title">{title}</div>{note_html}\n'
        f'        </div>\n'
        f'      </div>'
    )


def inject_items(html: str, new_items: list[dict]) -> str:
    new_html = "".join(build_news_html(i) for i in new_items)
    html = re.sub(
        r'(<div class="news-list">)',
        r"\1" + new_html,
        html,
        count=1,
    )
    today = datetime.now().strftime("%B %Y")
    html = re.sub(r"Last updated: [^<]+", f"Last updated: {today}", html)
    return html


def main() -> None:
    with open("index.html", encoding="utf-8") as f:
        html = f.read()

    existing = get_existing_titles(html)
    new_items: list[dict] = []

    for url, _kind in SOURCES:
        print(f"Fetching {url} …")
        soup = fetch(url)
        if soup is None:
            continue
        found = extract_items(soup)
        print(f"  Found {len(found)} relevant article(s) on page.")
        for item in found:
            if item["title"] not in existing:
                new_items.append(item)
                print(f"  + NEW: {item['title']}")

    if not new_items:
        print("No new items. index.html unchanged.")
        sys.exit(0)

    updated = inject_items(html, new_items)
    if updated == html:
        print("Injection produced no diff. index.html unchanged.")
        sys.exit(0)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(updated)
    print(f"index.html updated with {len(new_items)} new item(s).")


if __name__ == "__main__":
    main()
