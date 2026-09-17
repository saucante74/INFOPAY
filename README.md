# InfoPay AI — Backend scaffold

## Structure

```
backend/
  app/
    models/payslip.py      # Schéma Pydantic (extraction) + table SQLModel
    services/
      extraction.py        # PDF -> texte (pdfplumber) -> extraction LLM structurée
      vectorstore.py        # ChromaDB : indexation + recherche RAG
      analytics.py          # Calculs exacts (Pandas) sur les bulletins stockés
    agent/
      tools.py              # 2 tools LangChain exposés au LLM
      graph.py               # Graphe LangGraph (agent <-> tools)
    routers/
      upload.py              # POST /api/upload, GET /api/payslips
      chat.py                 # POST /api/chat
    main.py                   # App FastAPI, CORS, montage des routers
    db.py                      # Connexion SQLite / SQLModel
  requirements.txt
  .env.example
```

## Démarrage (jour 1)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# éditer .env et coller votre clé ANTHROPIC_API_KEY

uvicorn app.main:app --reload --port 8000
```

Vérifier que ça tourne : http://localhost:8000/api/health doit renvoyer `{"status": "ok"}`.
Doc interactive auto-générée : http://localhost:8000/docs — pratique pour tester
`/api/upload` (avec un vrai PDF) et `/api/chat` sans attendre le frontend.

## Ce qui est déjà fonctionnel

- Schéma Pydantic complet (les 8 champs demandés)
- Pipeline d'extraction PDF -> LLM structuré (gère les formats de bulletins variés)
- Indexation vectorielle ChromaDB (embedding local, pas d'API externe nécessaire pour ça)
- Moteur analytique Pandas (somme/moyenne/min/max sur N derniers mois)
- Graphe LangGraph à 2 nœuds (agent + tools) avec routage par tool-calling Claude
- Endpoints `/api/upload`, `/api/payslips`, `/api/chat`

## Ce qu'il reste à faire

1. **Tester avec de vrais PDF** de bulletins de paie (formats différents si possible)
   pour valider l'extraction — c'est le point le plus fragile, à tester en premier.
2. **Frontend React (Vite)** — pas encore généré. Étapes :
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npm install lucide-react recharts axios
   ```
3. Ajuster le prompt d'extraction (`extraction.py`) si certains champs sont
   mal extraits sur vos formats de bulletins réels.

## Points à savoir avant de lancer

- `chromadb` et `langchain`/`langgraph` sont des dépendances assez lourdes à
  installer (plusieurs dizaines de Mo) — la première installation peut prendre
  quelques minutes.
- Le modèle utilisé partout est `claude-sonnet-4-6` (variable `EXTRACTION_MODEL`
  dans `extraction.py` et `CHAT_MODEL` dans `graph.py`) — changez-le si besoin.
- La base ChromaDB est stockée dans `./chroma_data/` et SQLite dans `./infopay.db`,
  tous deux créés automatiquement au premier lancement (ajoutez-les à `.gitignore`).
