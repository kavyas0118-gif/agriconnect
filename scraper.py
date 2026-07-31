"""
BigBasket Fresh Vegetables Scraper
- Uses Playwright to handle dynamic/JS-rendered content
- Scrolls the page to trigger lazy-loaded products
- Extracts: product name, price, weight/unit, image URL
- Saves results to Supabase (and optionally vegetables.csv as backup)

Supabase table required:
  CREATE TABLE scraped_vegetables (
    id            BIGSERIAL PRIMARY KEY,
    product       TEXT NOT NULL,
    price         TEXT,
    weight        TEXT,
    image_url     TEXT,
    scraped_at    TIMESTAMPTZ DEFAULT NOW()
  );
"""

import csv
import os
import time
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright
from supabase import create_client, Client

# ── Supabase config (reads from .env via os.environ) ──────────────────────────
SUPABASE_URL = os.environ.get(
    "VITE_SUPABASE_URL", "https://iqqwluznjbbeosfkctsa.supabase.co"
)
SUPABASE_KEY = os.environ.get(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcXdsdXpuamJiZW9zZmtjdHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjkyODUsImV4cCI6MjA5MDc0NTI4NX0"
    ".FVihYUC8KLuMp7xWj_0JS8ecy_7ftqAOSmjjZ7CeLV0",
)
TABLE_NAME   = "scraped_vegetables"

# ── Scraper config ─────────────────────────────────────────────────────────────
URL         = "https://www.bigbasket.com/pc/fruits-vegetables/fresh-vegetables/"
CSV_BACKUP  = "vegetables.csv"   # also saved locally as a backup


# ── Helpers ────────────────────────────────────────────────────────────────────

def scroll_to_bottom(page, pause_seconds=2, max_scrolls=10):
    """Scroll down incrementally to trigger lazy-loaded product cards."""
    for i in range(max_scrolls):
        prev_height = page.evaluate("document.body.scrollHeight")
        page.evaluate("window.scrollBy(0, window.innerHeight * 2)")
        time.sleep(pause_seconds)
        new_height = page.evaluate("document.body.scrollHeight")
        print(f"  Scroll {i + 1}/{max_scrolls} — page height: {new_height}px")
        if new_height == prev_height:
            print("  Reached end of page or no new content loaded.")
            break


def extract_text(card, selectors):
    """Return text from the first matching selector, or empty string."""
    for sel in selectors:
        try:
            el = card.query_selector(sel)
            if el:
                text = el.inner_text().strip()
                if text:
                    return text
        except Exception:
            continue
    return ""


def extract_attr(card, selectors, attr="src"):
    """Return an attribute value from the first matching selector."""
    for sel in selectors:
        try:
            el = card.query_selector(sel)
            if el:
                val = el.get_attribute(attr)
                if val:
                    return val
        except Exception:
            continue
    return ""


def extract_products(page):
    """
    Try multiple selector strategies to find product cards.
    BigBasket uses React so class names can change — we try several patterns.
    """
    products = []

    card_selectors = [
        "li.PaginateItems___StyledLi",
        "li[class*='PaginateItems']",
        "div[class*='SKUDeck']",
        "div[qa='product-card']",
        "[data-qa='product-card']",
    ]

    cards = []
    for selector in card_selectors:
        cards = page.query_selector_all(selector)
        if cards:
            print(f"  Found {len(cards)} product cards using selector: '{selector}'")
            break

    if not cards:
        print("  WARNING: No product cards found with known selectors.")
        print("  Dumping raw page HTML to debug_page.html for inspection...")
        with open("debug_page.html", "w", encoding="utf-8") as f:
            f.write(page.content())
        return products

    for card in cards:
        name  = extract_text(card, [
            "[qa='product-name']",
            "[class*='ProductName']",
            "h3",
            "span[class*='Name']",
        ])
        price = extract_text(card, [
            "[class*='Pricing__StyledPrice']",
            "[class*='discounted-price']",
            "span[class*='Price']",
            "[qa='selling-price']",
        ])
        weight = extract_text(card, [
            "[class*='PackSize']",
            "[class*='weight']",
            "span[class*='Weight']",
            "[qa='pack-size']",
        ])
        image = extract_attr(card, [
            "img[src*='bbprodimgs']",
            "img[class*='Img']",
            "img",
        ], attr="src")

        if name:
            products.append({
                "product":   name,
                "price":     price  or "N/A",
                "weight":    weight or "N/A",
                "image_url": image  or "N/A",
            })

    return products


# ── Storage ────────────────────────────────────────────────────────────────────

def save_to_csv(products):
    """Write the product list to a local CSV as a backup."""
    if not products:
        return
    with open(CSV_BACKUP, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["product", "price", "weight", "image_url"])
        writer.writeheader()
        writer.writerows(products)
    print(f"  CSV backup saved to '{CSV_BACKUP}' ({len(products)} rows)")


def save_to_supabase(products):
    """
    Upsert scraped products into Supabase.

    Each row includes a scraped_at timestamp.
    Uses upsert on 'product' column so re-running the scraper
    updates existing rows instead of creating duplicates.
    """
    if not products:
        print("  No products to save to Supabase.")
        return

    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    scraped_at = datetime.now(timezone.utc).isoformat()

    rows = [
        {**p, "scraped_at": scraped_at}
        for p in products
    ]

    # Upsert in batches of 100 to stay within API limits
    batch_size = 100
    total_saved = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        response = (
            client.table(TABLE_NAME)
            .upsert(batch, on_conflict="product")   # update price/weight if product already exists
            .execute()
        )
        total_saved += len(batch)
        print(f"  Supabase: upserted batch {i // batch_size + 1} ({len(batch)} rows)")

    print(f"  Done — {total_saved} products saved to Supabase table '{TABLE_NAME}'")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=False)  # set True to run silently
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        print(f"Navigating to: {URL}")
        page.goto(URL, wait_until="domcontentloaded", timeout=60000)

        print("Waiting for products to load...")
        try:
            page.wait_for_selector(
                "li[class*='PaginateItems'], div[class*='SKUDeck'], [qa='product-card']",
                timeout=15000,
            )
        except Exception:
            print("  Timed out waiting for product selector — will try anyway.")

        print("Scrolling to load all products...")
        scroll_to_bottom(page, pause_seconds=2, max_scrolls=10)

        print("Extracting product data...")
        products = extract_products(page)
        browser.close()

    if not products:
        print("No products extracted. Check debug_page.html for the page structure.")
        return

    print(f"\nExtracted {len(products)} products. Sample (first 3):")
    for item in products[:3]:
        print(f"  {item}")

    print("\nSaving to Supabase...")
    save_to_supabase(products)

    print("\nSaving CSV backup...")
    save_to_csv(products)


if __name__ == "__main__":
    main()
