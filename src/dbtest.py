from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
ATLAS_URI = os.getenv("DATABASE_URL")
DB_NAME = os.getenv("DB_NAME", "app_database")

def get_connection():
    return MongoClient(ATLAS_URI)

def test_connection():
    try:
        client = get_connection()
        db = client[DB_NAME]
        db.command('ping')  # Basic connectivity check
        print("✅ Atlas connection verified")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def data_retrieve():
    if not test_connection():
        return
    
    try:
        client = get_connection()
        db = client[DB_NAME]
        print("📂 Collections:", db.list_collection_names())
    except Exception as e:
        print(f"🚨 Data retrieval failed: {str(e)}")

def rename_col():
    if not test_connection():
        return
    client = get_connection()
    db = client[DB_NAME]
    db["apps"].rename("old_apps",dropTarget=False)
    db["new_apps2"].rename("apps", dropTarget=False)
    print("📂 Collections:", db.list_collection_names())



if __name__ == "__main__":
    data_retrieve()
    rename_col()