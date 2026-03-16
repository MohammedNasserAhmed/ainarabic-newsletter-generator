"""
aiNarabic Newsletter Generator
Core logic:
  1. Exa (type=auto) fetches AI news articles from the past week.
  2. Articles are deduplicated by URL and title similarity before LLM processing.
  3. Groq LLM (llama-3.3-70b-versatile) summarizes and structures them.
  4. Final items are deduplicated by topic similarity to remove same-story coverage.
"""

import os
import json
import re
from difflib import SequenceMatcher
from datetime import datetime, timedelta
from exa_py import Exa
from groq import Groq

from config import (
    LOOKBACK_DAYS,
    NUM_RESULTS,
    MAX_CHARACTERS,
    SEARCH_QUERIES,
    SEARCH_TYPE,
    GROQ_MODEL,
    GROQ_MAX_TOKENS,
)


def get_date_range() -> tuple[str, str]:
    """Return (start_date, end_date) as ISO strings for the lookback window."""
    end = datetime.utcnow()
    start = end - timedelta(days=LOOKBACK_DAYS)
    return start.strftime("%Y-%m-%dT%H:%M:%SZ"), end.strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_articles(exa: Exa, query: str, start_date: str, end_date: str) -> list[dict]:
    """
    Search Exa for a query and return raw article dicts
    with title, url, published_date, and text.
    """
    print(f"  Searching: {query!r} ...")
    try:
        results = exa.search_and_contents(
            query,
            type=SEARCH_TYPE,
            num_results=NUM_RESULTS,
            start_published_date=start_date,
            end_published_date=end_date,
            text={"max_characters": MAX_CHARACTERS},
        )
        articles = []
        for r in results.results:
            articles.append({
                "title": getattr(r, "title", "") or "",
                "url": getattr(r, "url", "") or "",
                "published_date": getattr(r, "published_date", "") or "",
                "text": getattr(r, "text", "") or "",
            })
        return articles
    except Exception as e:
        print(f"    Warning: search failed for '{query}': {e}")
    return []


def summarize_with_groq(groq_client: Groq, articles: list[dict]) -> list[dict]:
    """
    Send raw Exa articles to Groq and get back structured newsletter items.
    Returns a list of dicts: {topic, summary, date, url, category}.
    """
    if not articles:
        return []

    # Build a compact article digest for the prompt
    digest_parts = []
    for i, a in enumerate(articles, 1):
        date_str = (a["published_date"] or "")[:10]
        text_snippet = (a["text"] or "")[:1500].strip()
        digest_parts.append(
            f"[{i}] Title: {a['title']}\n"
            f"    URL: {a['url']}\n"
            f"    Date: {date_str}\n"
            f"    Content: {text_snippet}"
        )
    digest = "\n\n".join(digest_parts)

    system_prompt = (
        "You are an expert AI news analyst for the aiNarabic newsletter, "
        "which tracks the most important AI announcements each week. "
        "You ONLY extract concrete announcements: new model releases, new embedding models, "
        "new AI frameworks/libraries, new or trending AI platforms/tools. "
        "You SKIP opinion pieces, general analysis articles, listicles, tutorials, "
        "and articles that do not announce something specific and new."
    )

    user_prompt = f"""Analyze the following AI news articles and extract ONLY concrete announcements.

Include ONLY items that announce something NEW:
- A new AI model or embedding model released
- A new AI framework, library, or toolkit launched
- A new or trending AI platform or tool
- A major AI company product launch or update

Do NOT include: opinion pieces, analysis articles, tutorials, roundups, or general industry commentary.

For each item return a JSON object with these exact fields:
- topic: short title, max 10 words
- summary: concise ~50-word summary of what was announced and why it matters
- date: publication date in YYYY-MM-DD format (use the article date)
- url: the source URL
- category: exactly one of "Model Release", "Research", "Product", "Funding", "Policy", "Open Source", "Other"

Return ONLY a valid JSON object in this format:
{{"items": [{{...}}, {{...}}]}}

Articles:
{digest}"""

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=GROQ_MAX_TOKENS,
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)
        return data.get("items", [])
    except Exception as e:
        print(f"    Warning: Groq summarization failed: {e}")
    return []


def _normalize(text: str) -> str:
    """Lowercase and strip punctuation for fuzzy comparison."""
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()


def _similarity(a: str, b: str) -> float:
    """Return 0..1 similarity ratio between two strings."""
    return SequenceMatcher(None, _normalize(a), _normalize(b)).ratio()


def deduplicate_articles(
    articles: list[dict],
    title_threshold: float = 0.85,
    content_threshold: float = 0.60,
) -> list[dict]:
    """
    Layer 1 deduplication — applied to raw Exa articles before sending to Groq.
    Removes articles with:
      - identical URLs
      - very similar titles (ratio >= title_threshold)
      - very similar content text (ratio >= content_threshold)
        catches same-subject articles with different titles/URLs
    """
    seen_urls: set[str] = set()
    seen_titles: list[str] = []
    seen_texts: list[str] = []
    unique: list[dict] = []

    for article in articles:
        url = article.get("url", "").strip()
        title = article.get("title", "").strip()
        text_snippet = (article.get("text", "") or "")[:300].strip()

        # Exact URL dedup
        if url and url in seen_urls:
            continue

        # Title similarity dedup
        if title and any(_similarity(title, t) >= title_threshold for t in seen_titles):
            continue

        # Content text similarity dedup — catches same story from different outlets
        if text_snippet and any(
            _similarity(text_snippet, t) >= content_threshold for t in seen_texts
        ):
            continue

        if url:
            seen_urls.add(url)
        if title:
            seen_titles.append(title)
        if text_snippet:
            seen_texts.append(text_snippet)
        unique.append(article)

    return unique


def deduplicate_items(
    items: list[dict],
    combined_threshold: float = 0.55,
) -> list[dict]:
    """
    Layer 2 deduplication — applied to newsletter items after Groq extraction.
    Removes items with:
      - identical URLs
      - similar topic + summary (weighted score >= combined_threshold)
        catches same-subject items even when topic titles differ
    Keeps the item with the longer (more detailed) summary.
    """
    # First pass: exact URL dedup
    seen_urls: set[str] = set()
    url_deduped: list[dict] = []
    for item in items:
        url = item.get("url", "").strip()
        if url and url in seen_urls:
            continue
        if url:
            seen_urls.add(url)
        url_deduped.append(item)

    # Second pass: topic + summary similarity dedup
    unique: list[dict] = []
    for item in url_deduped:
        topic = item.get("topic", "")
        summary = item.get("summary", "")
        matched = False
        for i, kept in enumerate(unique):
            topic_sim = _similarity(topic, kept.get("topic", ""))
            summary_sim = _similarity(summary, kept.get("summary", ""))
            # Weighted: summary matters more since topics can be worded differently
            combined = topic_sim * 0.4 + summary_sim * 0.6
            if combined >= combined_threshold:
                # Keep the one with the longer summary (more informative)
                if len(summary) > len(kept.get("summary", "")):
                    unique[i] = item
                matched = True
                break
        if not matched:
            unique.append(item)

    return unique


def sort_items(items: list[dict]) -> list[dict]:
    """Sort items by date descending (most recent first)."""
    def parse_date(item):
        try:
            return datetime.strptime(item.get("date", "1970-01-01"), "%Y-%m-%d")
        except ValueError:
            return datetime.min

    return sorted(items, key=parse_date, reverse=True)


def generate_newsletter() -> list[dict]:
    """
    Main pipeline:
      1. Validate API keys.
      2. For each query: fetch articles via Exa, summarize with Groq.
      3. Deduplicate by URL and sort by date.
    """
    exa_key = os.environ.get("EXA_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")

    if not exa_key:
        raise EnvironmentError("EXA_API_KEY is not set. Copy .env.example to .env and add your key.")
    if not groq_key:
        raise EnvironmentError("GROQ_API_KEY is not set. Copy .env.example to .env and add your key.")

    exa = Exa(api_key=exa_key)
    groq_client = Groq(api_key=groq_key)
    start_date, end_date = get_date_range()

    print(f"\nGenerating aiNarabic Newsletter")
    print(f"Search engine : Exa ({SEARCH_TYPE})")
    print(f"Summarizer    : Groq ({GROQ_MODEL})")
    print(f"Date range    : {start_date[:10]} -> {end_date[:10]}")
    print(f"Queries       : {len(SEARCH_QUERIES)}\n")

    # Step 1: collect all raw articles from every query
    all_articles: list[dict] = []
    for query in SEARCH_QUERIES:
        articles = fetch_articles(exa, query, start_date, end_date)
        all_articles.extend(articles)
        print(f"    -> {len(articles)} articles fetched")

    print(f"\nRaw articles  : {len(all_articles)} total")

    # Step 2: deduplicate articles before sending to Groq (saves tokens + avoids same story extracted twice)
    unique_articles = deduplicate_articles(all_articles)
    print(f"Unique articles: {len(unique_articles)} (after URL + title dedup)")

    # Step 3: send unique articles to Groq in batches of 15
    BATCH_SIZE = 15
    all_items: list[dict] = []
    batches = [unique_articles[i:i + BATCH_SIZE] for i in range(0, len(unique_articles), BATCH_SIZE)]
    print(f"Groq batches  : {len(batches)} x ~{BATCH_SIZE} articles\n")

    for idx, batch in enumerate(batches, 1):
        print(f"  Batch {idx}/{len(batches)}: summarizing {len(batch)} articles...")
        items = summarize_with_groq(groq_client, batch)
        print(f"    -> {len(items)} items extracted")
        all_items.extend(items)

    print(f"\nRaw items     : {len(all_items)} extracted")

    # Step 4: deduplicate items by URL + topic similarity
    unique_items = deduplicate_items(all_items)
    sorted_items = sort_items(unique_items)
    print(f"Final items   : {len(sorted_items)} (after URL + topic similarity dedup)")
    return sorted_items


def format_newsletter_text(items: list[dict]) -> str:
    """Format the newsletter items into a readable markdown newsletter."""
    now = datetime.utcnow()
    week_start = (now - timedelta(days=LOOKBACK_DAYS)).strftime("%B %d")
    week_end = now.strftime("%B %d, %Y")

    lines = [
        "# aiNarabic Weekly AI Newsletter",
        f"### Week of {week_start} - {week_end}",
        f"*{len(items)} AI stories from the past week*",
        "",
        "---",
        "",
    ]

    # Group by category
    categories: dict[str, list[dict]] = {}
    for item in items:
        cat = item.get("category", "Other")
        categories.setdefault(cat, []).append(item)

    category_order = ["Model Release", "Research", "Product", "Funding", "Policy", "Open Source", "Other"]

    for cat in category_order:
        if cat not in categories:
            continue
        lines.append(f"## {cat}")
        lines.append("")
        for item in categories[cat]:
            topic = item.get("topic", "Untitled")
            summary = item.get("summary", "")
            date = item.get("date", "")
            url = item.get("url", "")

            lines.append(f"### {topic}")
            if date:
                lines.append(f"*{date}*")
            lines.append("")
            lines.append(summary)
            lines.append("")
            if url:
                lines.append(f"[Read more]({url})")
            lines.append("")
            lines.append("---")
            lines.append("")

    lines.append(f"*Generated by aiNarabic Newsletter Generator | Exa search + Groq ({GROQ_MODEL})*")
    return "\n".join(lines)
