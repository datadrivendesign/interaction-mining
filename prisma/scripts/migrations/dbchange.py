from pymongo import MongoClient
from pymongo.errors import OperationFailure, PyMongoError
import os
from dotenv import load_dotenv
import certifi
from datetime import datetime

load_dotenv()

class AtlasMigrator:
    def __init__(self):
        self.client = None
        self.db = None
        
        # Configuration
        self.ATLAS_URI = os.getenv("DATABASE_URL")
        self.DB_NAME = os.getenv("DB_NAME", "app_database")
        self.SOURCE_COL = "apps"
        self.TARGET_COL = "new_apps2"
        
        # SSL Configuration
        self.ssl_kwargs = {
            'tls': True,
            'tlsCAFile': certifi.where(),
            'connectTimeoutMS': 30000,
            'serverSelectionTimeoutMS': 10000
        }

    def connect(self):
        """Establish secure Atlas connection"""
        try:
            self.client = MongoClient(self.ATLAS_URI, **self.ssl_kwargs)
            self.db = self.client[self.DB_NAME]
            self.db.command('ping')  # Test connection
            print("Verified Atlas connection")
            return True
        except PyMongoError as e:
            print(f"Connection failed: {str(e)}")
            return False

    def duplicate_collection(self):
        """Migrate data using aggregation pipeline"""
        try:
            print(f"Starting migration from {self.SOURCE_COL} to {self.TARGET_COL}")
            
            pipeline = [
                {
                    "$project": {
                        "_id": 1,
                        "__v": {"$ifNull": ["$__v", 0]},
                        "category": 1,
                        "packageName": 1,
                        "captured": {"$toDate": "$_id"},
                        "metadata": {
                            "company": "$company",
                            "name": "$name",
                            "cover": "$cover",
                            "description": "$description",
                            "icon": "$icon",
                            "rating": "$rating",
                            "reviews": None,
                            "genre": [],
                            "downloads": "$downloads"
                        }
                    }
                },
                {"$out": self.TARGET_COL}
            ]
            
            self.db[self.SOURCE_COL].aggregate(pipeline)
            print(f"Successfully duplicated to {self.TARGET_COL}")
            return True
            
        except OperationFailure as e:
            print(f"Aggregation failed: {e.details['errmsg']}")
            return False

    def apply_validation(self):
        """Apply JSON schema validation"""
        try:
            validation_rules = {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["packageName","captured", "metadata"],
                    "properties": {
                        "packageName": {
                            "bsonType": "string",
                            "pattern": "^com\\.[a-z0-9]+(\\.[a-z0-9]+)*$"
                        },
                        "metadata": {
                            "bsonType": "object",
                            "required": ["company", "name", "icon"],
                            "properties": {
                                "company": {"bsonType": "string"},
                                "name": {"bsonType": "string"},
                                "cover": {"bsonType": "string"},
                                "description": {"bsonType": "string"},
                                "icon": {"bsonType": "string"},
                                "rating": {"bsonType": "string"},
                                "reviews": {"bsonType": ["string", "null"]},
                                "genre": {
                                    "bsonType": "array",
                                    "items": {"bsonType": "string"}
                                },
                                "downloads":{"bsonType": "string"}
                            }
                        },
                        "__v":{
                            "bsonType": "int"
                        }
                    }
                }
            }
            
            self.db.command("collMod", self.TARGET_COL, validator=validation_rules)
            print("Applied schema validation successfully")
            return True
            
        except OperationFailure as e:
            print(f"Validation failed: {e.details['errmsg']}")
            return False

    def migrate_data(self):
        try:
            collection = self.db[self.TARGET_COL]
            
            update_result = collection.update_many(
                {"metadata.rating": {"$type": "number"}},
                [{"$set": {"metadata.rating": {"$toString": "$metadata.rating"}}}]
            )
            
            print(f"Converted {update_result.modified_count} ratings to strings")
            return True
            
        except OperationFailure as e:
            print(f"Data migration failed: {e.details['errmsg']}")
            return False
    
    def check_collection(self):
        client = MongoClient(self.ATLAS_URI, **self.ssl_kwargs)
        db = client[self.DB_NAME]

        if 'new_apps' in db.list_collection_names():
            print("✅ new_apps exists with", db.new_apps.count_documents({}), "docs")
            print("🔍 Sample doc:", db.new_apps.find_one())
        else:
            print("❌ new_apps collection missing")

    def run(self):
        """Execute full migration workflow"""
        if not self.connect():
            return
        
        try:
            if (self.duplicate_collection() and 
                self.apply_validation() and 
                self.migrate_data()):
                    print("\nMigration completed successfully")
                    print(f"Verify new collection: {self.TARGET_COL}")
        finally:
            if self.client:
                self.client.close()
                print("Connection closed")

if __name__ == "__main__":
    migrator = AtlasMigrator()
    migrator.run()
