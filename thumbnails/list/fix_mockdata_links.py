"""
Synchronise les URLs YouTube dans mockData.js à partir du mapping établi.
"""

import re

MOCKDATA = "/Users/andrianinaralison/Projets Claude/Plateforme Web Veille Video/veille-creative/src/data/mockData.js"

# Mapping wed-id → url directe (établi depuis le markdown mis à jour)
MAPPING = {
    "wed-002": "https://www.youtube.com/watch?v=mA6gU6TncDA",
    "wed-003": "https://www.youtube.com/watch?v=LeCYDdAw3hs",
    "wed-004": "https://www.youtube.com/watch?v=x9g4OUgIp3s",
    "wed-005": "https://www.youtube.com/watch?v=T--lHY-w2Y4",
    "wed-006": "https://www.youtube.com/watch?v=C6HAVnCidYk",
    "wed-007": "https://www.youtube.com/watch?v=s4dWp9_nNYk",
    "wed-008": "https://www.youtube.com/watch?v=WcoEB7aH1b8",
    "wed-009": "https://www.youtube.com/watch?v=StxcxzUkd1Y",
    "wed-010": "https://www.youtube.com/watch?v=ww83upWRseA",
    "wed-011": "https://www.youtube.com/watch?v=kzLLJjrlUxE",
    "wed-012": "https://www.youtube.com/watch?v=41HTWSYfG0k",
    "wed-013": "https://www.youtube.com/watch?v=KCQfCVBOtCE",
    "wed-014": "https://www.youtube.com/watch?v=JjJ6xXF9pRo",
    "wed-015": "https://www.youtube.com/watch?v=NlO2nJAfXzc",
    "wed-016": "https://www.youtube.com/watch?v=Fxsqv98J_fU",
    "wed-017": "https://www.youtube.com/watch?v=BLhgQhV6qeQ",
    "wed-018": "https://www.youtube.com/watch?v=kL5efJ8hz3U",
    "wed-019": "https://www.youtube.com/watch?v=wL0Mjgb8ZuU",
    "wed-020": "https://www.youtube.com/watch?v=MmxAu6jJKc4",
    "wed-021": "https://www.youtube.com/watch?v=quWs3za9B3c",
    "wed-022": "https://www.youtube.com/watch?v=q0ksgf_-3lU",
    "wed-023": "https://www.youtube.com/watch?v=VkrTd9FRxWI",
    "wed-024": "https://www.youtube.com/watch?v=eM-mJcHYLmU",
    "wed-025": "https://www.youtube.com/watch?v=GsanJOjmmA8",
    "wed-026": "https://www.youtube.com/watch?v=mS1bCmbiE9o",
    "wed-027": "https://www.youtube.com/watch?v=cfoyPgsz8jo",
    # wed-028 : Daphne & Bayo — non trouvé, lien search conservé
    "wed-030": "https://www.youtube.com/watch?v=87kGxESaiFI",
    "wed-031": "https://www.youtube.com/watch?v=p4yEJwzbYD4",
    "wed-032": "https://www.youtube.com/watch?v=N1utFWKCMtU",
    "wed-033": "https://www.youtube.com/watch?v=G9-bwlXqIv4",
    "wed-034": "https://www.youtube.com/watch?v=z7umLX5OgN8",
    "wed-035": "https://www.youtube.com/watch?v=5Juqwag6X9Y",
    "wed-036": "https://www.youtube.com/watch?v=3G7o_7MF8zs",
    "wed-037": "https://www.youtube.com/watch?v=mopkPZHYR-w",
    "wed-038": "https://www.youtube.com/watch?v=NEFWcuR4Fv4",
    "wed-039": "https://www.youtube.com/watch?v=ID59D9vItI4",
    "wed-040": "https://www.youtube.com/watch?v=XnePCIWw884",
    "wed-041": "https://www.youtube.com/watch?v=35ftbG4Lup4",
    "wed-042": "https://www.youtube.com/watch?v=F9u1ZD9NXac",
    "wed-043": "https://www.youtube.com/watch?v=U8MbInvJ9xs",
    "wed-044": "https://www.youtube.com/watch?v=oNp6LIAUukA",
    "wed-045": "https://www.youtube.com/watch?v=R66rRk63rR4",
    "wed-046": "https://www.youtube.com/watch?v=Cks3jVir9DA",
    "wed-047": "https://www.youtube.com/watch?v=F9u1ZD9NXac",
    "wed-048": "https://www.youtube.com/watch?v=qXILpNNyh3w",
    "wed-049": "https://www.youtube.com/watch?v=gfR3UcP5Oes",
    "wed-050": "https://www.youtube.com/watch?v=d4n6Mafhhtw",
    "wed-051": "https://www.youtube.com/watch?v=D9V7rqpVA1M",
    "wed-052": "https://www.youtube.com/watch?v=DjTYS5QA-nc",
    "wed-053": "https://www.youtube.com/watch?v=Q35hT30cIWE",
    "wed-054": "https://www.youtube.com/watch?v=0DFYK1j5W00",
    "wed-055": "https://www.youtube.com/watch?v=mP-rSl5QD9M",
    "wed-056": "https://www.youtube.com/watch?v=i24rMB4BLl0",
    "wed-057": "https://www.youtube.com/watch?v=VvleB_WLxOQ",
    "wed-058": "https://www.youtube.com/watch?v=eqX37qkeYWo",
    "wed-059": "https://www.youtube.com/watch?v=OFt9XiQCCDI",
    "wed-060": "https://www.youtube.com/watch?v=ODPXAm_SqoE",
}

with open(MOCKDATA, "r", encoding="utf-8") as f:
    content = f.read()

replaced = 0
skipped = []

for wed_id, new_url in MAPPING.items():
    # Trouve le bloc de l'entrée wed-XXX et remplace l'url search à l'intérieur
    # Pattern : après l'id wed-XXX, trouve la prochaine ligne url: '...' qui est un lien search
    pattern = re.compile(
        r"(id:\s*['\"]" + re.escape(wed_id) + r"['\"].*?url:\s*['\"])(https://www\.youtube\.com/results\?[^'\"]+)(['\"])",
        re.DOTALL
    )
    new_content, n = pattern.subn(lambda m: m.group(1) + new_url + m.group(3), content)
    if n > 0:
        content = new_content
        replaced += 1
        print(f"  ✅ {wed_id} → {new_url}")
    else:
        skipped.append(wed_id)
        print(f"  ⚠️  {wed_id} — déjà mis à jour ou pattern non trouvé")

with open(MOCKDATA, "w", encoding="utf-8") as f:
    f.write(content)

# Vérification finale
remaining = len(re.findall(r"results\?search_query=", content))
print(f"\n✅ {replaced} URLs remplacées")
if skipped:
    print(f"⚠️  {len(skipped)} ignorées : {skipped}")
print(f"🔍 Liens search restants dans mockData.js : {remaining} (attendu : 1 = wed-028)")
