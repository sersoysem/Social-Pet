# test_read.py

from firebase_init import db

def read_pets():
    pets_ref = db.collection("Sliders")
    docs = pets_ref.stream()

    for doc in docs:
        print(f"{doc.id} => {doc.to_dict()}")

if __name__ == "__main__":
    read_pets()
