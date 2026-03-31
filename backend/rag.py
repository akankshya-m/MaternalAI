import os
import pandas as pd
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
PATIENTS_CSV = os.path.join(os.path.dirname(__file__), "patients.csv")
COLLECTION_NAME = "patients"

_client = None
_collection = None
_model = None


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _client


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def build_index():
    client = _get_client()
    collection = client.get_or_create_collection(COLLECTION_NAME)

    if collection.count() > 0:
        print(f"Index already built ({collection.count()} docs). Skipping.")
        return collection

    df = pd.read_csv(PATIENTS_CSV)
    model = _get_model()

    documents = []
    embeddings = []
    ids = []
    metadatas = []

    for _, row in df.iterrows():
        doc = (
            f"Patient {row['name']} (ID: {row['patient_id']}), age {row['age']}, "
            f"gestational week {row['gestational_week']}. "
            f"BP: {row['systolic_bp']}/{row['diastolic_bp']} mmHg. "
            f"Missed appointments: {row['missed_appointments']}. "
            f"Income: {row['income_level']}. Transport: {row['transport_access']}. "
            f"Last visit: {row['last_visit_days_ago']} days ago. "
            f"Hemoglobin: {row['hemoglobin']} g/dL. "
            f"Previous complications: {row['previous_complications']}. "
            f"Area: {row['area']}."
        )
        embedding = model.encode(doc).tolist()
        documents.append(doc)
        embeddings.append(embedding)
        ids.append(row["patient_id"])
        metadatas.append({"name": row["name"], "area": row["area"], "income_level": row["income_level"]})

    collection.add(documents=documents, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print(f"Built index with {collection.count()} patient records.")
    return collection


def _get_collection():
    global _collection
    if _collection is None:
        _collection = build_index()
    return _collection


def search(query: str, n_results: int = 5) -> dict:
    collection = _get_collection()
    model = _get_model()
    query_embedding = model.encode(query).tolist()

    results = collection.query(query_embeddings=[query_embedding], n_results=min(n_results, collection.count()))

    docs = results["documents"][0]
    metas = results["metadatas"][0]

    context = "\n".join(docs)
    citations = [m["name"] for m in metas]

    return {"context": context, "citations": citations}


if __name__ == "__main__":
    build_index()
    result = search("rural patients with high blood pressure")
    print("\nSearch results for 'rural patients with high blood pressure':")
    print("Citations:", result["citations"])
    print("\nContext snippet:", result["context"][:300])
