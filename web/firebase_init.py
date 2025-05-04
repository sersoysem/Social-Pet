import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage
from google.oauth2 import service_account
import uuid

# 🔐 Servis hesabı dosyanı tanıt
SERVICE_ACCOUNT_FILE = "firebase-adminsdk.json"  # Dosya yolunu gerekirse tam düzelt   C:\Users\HUAWEI\Documents\GitHub\Social-Pet\web

# Firebase Admin başlat
cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "projectId": "socialpet-b392b"
    })

# Firestore veritabanı bağlantısı
db = firestore.client(database_id="socialpet")

# 📁 Storage için credentials oluştur
storage_credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)

def upload_to_firebase_storage(file_obj, filename):
    # ✅ BU DOĞRU BUCKET ADIDIR:
    bucket_name = "socialpet-b392b.firebasestorage.app"
    destination_blob_name = f"pets/{uuid.uuid4()}_{filename}"

    # 🔐 credentials ile storage client başlat
    storage_client = storage.Client(credentials=storage_credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    # 🔼 Dosyayı yükle
    blob.upload_from_file(file_obj, content_type=file_obj.content_type)
    blob.make_public()

    # 🔗 Public URL döndür
    return blob.public_url
