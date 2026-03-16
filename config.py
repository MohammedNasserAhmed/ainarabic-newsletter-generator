"""
Configuration for aiNarabic Newsletter Generator
"""

# Number of days to look back for news
LOOKBACK_DAYS = 7

# Number of search results per query
NUM_RESULTS = 10

# Max characters of page text to retrieve per article
MAX_CHARACTERS = 3000

# Search queries — focused on AI announcements, launches, and trending tools
SEARCH_QUERIES = [
    "new AI model released launched announced this week",
    "new embedding model AI vector model released this week",
    "new AI framework library toolkit launched this week",
    "trending AI platform tool product launch this week",
    "new open source AI model released this week",
    "major AI company announcement launch this week",
]

# Exa search type — "auto" is fast and balanced; Groq handles the summarization
SEARCH_TYPE = "auto"

# Groq model for summarization and structuring
# llama-3.3-70b-versatile: fast, high quality, supports JSON mode
GROQ_MODEL = "llama-3.3-70b-versatile"

# Max tokens for Groq response
GROQ_MAX_TOKENS = 4096
