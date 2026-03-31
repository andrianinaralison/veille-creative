import re
import time
import urllib.request
import urllib.parse
import json

API_KEY = "REMOVED_API_KEY"
MD_FILE = "cinematic_wedding_references_1.md"

def search_youtube(title, channel):
    query = f"{title} {channel}"
    params = urllib.parse.urlencode({
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 1,
        "key": API_KEY,
    })
    url = f"https://www.googleapis.com/youtube/v3/search?{params}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
        items = data.get("items", [])
        if items:
            video_id = items[0]["id"]["videoId"]
            return f"https://www.youtube.com/watch?v={video_id}"
    except Exception as e:
        print(f"  ⚠️  Erreur API pour '{title}': {e}")
    return None

# Regex pour matcher les lignes de tableau avec un lien search
ROW_RE = re.compile(
    r'(\| \d+ \| )(.+?)( \| )(.+?)( \| )(.+?)( \| \[▶️\]\()(https://www\.youtube\.com/results\?search_query=[^\)]+)(\))'
)

with open(MD_FILE, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
updated_lines = []
replaced = 0
skipped = 0

for line in lines:
    m = ROW_RE.match(line)
    if m:
        title_raw = m.group(2).strip()
        channel_raw = m.group(4).strip()
        # Nettoyer les échappements markdown
        title = title_raw.replace(r"\|", "|")
        channel = channel_raw.replace(r"\|", "|")
        print(f"🔍 Recherche: {title[:60]} — {channel[:30]}")
        direct_url = search_youtube(title, channel)
        if direct_url:
            new_line = line.replace(m.group(8), direct_url)
            updated_lines.append(new_line)
            print(f"  ✅ {direct_url}")
            replaced += 1
        else:
            updated_lines.append(line)
            print(f"  ❌ Non trouvé, lien inchangé")
            skipped += 1
        time.sleep(0.3)  # respecter le quota API
    else:
        updated_lines.append(line)

new_content = "\n".join(updated_lines)
with open(MD_FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"\n✅ Terminé — {replaced} liens remplacés, {skipped} non trouvés")
