# Simulation financière — 180 Degrés · 36 mois (v2 — hypothèses recalibrées)

> Mise à jour suite à benchmark SaaS 2025–2026.  
> Deux scénarios : **base case réaliste** et **scénario ambitieux**.  
> Sources : benchmarks churn SMB B2B, conversion freemium, LTV/CAC SaaS verticaux.

---

## 1. Unités économiques révisées

| Variable | Hypothèse initiale | Base case réaliste | Scénario ambitieux |
|---|---|---|---|
| ARPU moyen | 27€/mois | 23–25€ (début) → 27€ (maturité) | 27–30€ à M36 (mix Pro + Agency) |
| Mix tarifaire | 60% Solo / 40% Pro | 70–80% Solo au début (remises early adopters) | 50% Solo / 40% Pro / 10% Agency à M36 |
| Churn mensuel départ | 5% | 5–6% (freelances volatils) | 4–5% |
| Churn mensuel maturité | 3% | 3,5–4% | 2–3% (top quartile) |
| Conversion freemium → payant | 8% | 4–5% | 7–8% |
| LTV | 1 100€ | 600–800€ | 1 000–1 200€ |
| CAC | 100€ | 150–250€ (plein coût marketing + temps fondateur) | 100–150€ (acquisition très organique) |
| Ratio LTV/CAC | 10:1 | 3:1–5:1 | 5:1–7:1 |

> **Calcul LTV** : `LTV = ARPU × marge brute (80%) / churn mensuel`  
> - Churn 5% → LTV ≈ 432€  
> - Churn 3,5% → LTV ≈ 617€  
> - Churn 2,5% → LTV ≈ 864€  
> La LTV 1 100€ initiale supposait un churn ~2% — objectif ambitieux, pas hypothèse centrale.

---

## 2. Trajectoire abonnés / MRR

### Base case (ARPU 24€ moyen)

| Mois | Abonnés payants | MRR | ARR |
|---|---|---|---|
| M9 | 50 | ~1 200€ | ~14 400€ |
| M18 | 250 | ~6 000€ | ~72 000€ |
| M24 | 500 | ~12 000€ | ~144 000€ |
| M30 | 1 000 | ~24 000€ | ~288 000€ |
| M36 | 1 500 | ~36 000€ | ~432 000€ |

### Scénario ambitieux (ARPU 27€)

| Mois | Abonnés payants | MRR | ARR |
|---|---|---|---|
| M9 | 50 | ~1 350€ | ~16 200€ |
| M18 | 250 | ~6 750€ | ~81 000€ |
| M24 | 500 | ~13 500€ | ~162 000€ |
| M30 | 1 000 | ~27 000€ | ~324 000€ |
| M36 | 1 500 | ~40 500€ | ~486 000€ |

> ARR à M36 : **0,35–0,45M€** selon le scénario. Ordre de grandeur conservé.

---

## 3. Break-even recalibré

| Hypothèse | Abonnés nécessaires | Mois estimé |
|---|---|---|
| ARPU 27€, coûts 8 500€/mois | ~315 abonnés | ~M22 |
| ARPU 24€, coûts 8 500€/mois | ~355 abonnés | ~M23–M24 |
| ARPU 24€, coûts 9 500€/mois (+15% buffer) | ~395 abonnés | ~M24–M25 |

**Break-even réaliste : 350–400 abonnés payants, atteint entre M23 et M25.**

---

## 4. Phases — ressources et coûts

### Phase 1 — PoC · M0 à M3

**Cash investi : ~150€ · Revenus : 0€ · Solo**

| Ressources | Détail |
|---|---|
| Humain | Andri seul (~10h/semaine) |
| Tech | Railway free / Vercel free / Supabase free / Claude Cowork |

| Poste | Montant |
|---|---|
| Infra (Railway + domaine) | ~50€/mois |
| Anthropic API (tests) | ~0€ |
| **Total 3 mois** | **~150€** |

**Objectifs** : 1 200 refs ingérées · admin validé · 10 bêta-testeurs gratuits

---

### Phase 2 — MVP · M3 à M9

**Cash investi : ~2 000–2 200€ · Premiers revenus M7–M8**

| Ressources | Détail |
|---|---|
| Humain | Andri (~15h/semaine) |
| Tech | Railway payant · Supabase · Resend · Anthropic API |
| Marketing | Crowdfunding · communauté FB · influenceurs · abonnements offerts |

| Poste | Montant/mois |
|---|---|
| Infra mensuelle | ~100€ |
| Anthropic API | ~50€ |
| Audit sécurité / RGPD | ~500€ one-shot |
| **Total 6 mois** | **~1 900–2 200€** |

**Objectifs** : auth JWT · gestion projets · restitution client · digest · landing page

---

### Phase 3 — Go To Market · M9 à M18

**Cash investi : ~15 000–18 000€ (avec buffer +15–20%)**

| Ressources | Détail |
|---|---|
| Humain | Andri + curateur freelance + dev DevOps/sécurité part-time |
| Marketing | Influenceurs FR · SEO · ads · partenariat matériel Paris |

| Poste | Montant/mois (base) | Avec buffer +20% |
|---|---|---|
| Infra | ~200€ | ~240€ |
| Anthropic API | ~100€ | ~120€ |
| Curateur éditorial | ~500€ | ~600€ |
| Marketing | ~500€ | ~600€ |
| Dev freelance | ~200€ | ~240€ |
| **Total mensuel** | **~1 500€** | **~1 800€** |
| **Total 9 mois** | **~13 500€** | **~16 200€** |

---

### Phase 4 — Scale · M18 à M36

**Financement : revenus + levée pre-seed M32–M36**

| Ressources | Détail |
|---|---|
| Humain | Andri (CEO) + dev full-stack + curateur + growth/community |
| Produit | Plan Agency 89€ · partenariats écoles · expansion documentaire/specs ads |

| Poste | Montant/mois (M30) | Avec buffer +20% |
|---|---|---|
| Infra + API | ~500€ | ~600€ |
| Rémunération Andri | ~2 500€ | ~2 500€ |
| Dev + curateur + growth | ~4 000€ | ~4 800€ |
| Marketing + partenariats | ~1 500€ | ~1 800€ |
| **Total mensuel** | **~8 500€** | **~9 700€** |

---

## 5. Levée pre-seed · M32–M36

| Métrique | Cible initiale | Cible recalibrée |
|---|---|---|
| MRR | >25 000€ | >22 000–25 000€ |
| Churn mensuel | <3% | <3,5% (base) / <3% (ambitieux) |
| NPS | >40 | >40 |
| LTV observé | 1 100€ | 700–900€ |
| CAC observé | 100€ | 150–200€ |
| LTV/CAC | 10:1 | 4:1–5:1 |
| **Ticket visé** | 500k–1,5M€ | **500k–1,5M€ (inchangé)** |

> Un LTV:CAC de 4–5:1 avec churn tendant vers 3,5% et MRR >22k€ reste un dossier solide en pre-seed sur un marché de niche clair.

---

## 6. À recalibrer avec les données réelles (M9–M15)

Dès les premières cohortes MVP, mesurer :

- **Churn réel** par cohorte (mois 1, 3, 6)
- **Conversion freemium → payant** par canal (influenceurs vs SEO vs communauté)
- **ARPU réel** par segment (Solo / Pro / early adopters avec remise)
- **NPS à 30 jours** post-inscription

Ces données permettront de transformer les hypothèses en **unit economics observables** — narratif indispensable pour défendre la levée pre-seed.

---

*v2 — Mis à jour le 2026-05-31 sur base benchmarks SaaS 2025–2026*  
*v1 générée le 2026-05-31*
