import os
from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render, redirect
from django.http import JsonResponse
import json
from django.shortcuts import render, redirect
from datetime import datetime
from firebase_init import db, upload_to_firebase_storage
import uuid
from django.contrib import messages
from datetime import datetime

def serve_web_index(request):
    return render(request, 'index.html')

def serve_web_login(request):
    return render(request, 'login.html')

def serve_web_register(request):
    return render(request, 'register.html')

def serve_web_pet_profile(request):
    email = request.session.get("user_email")
    if not email:
        return redirect("/login/")

    return render(request, "pet-profile.html", {
        "user_email": email
    })



def toggle_favorite(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_email = request.session.get("user_email")
        pet_id = data.get("pet_id")

        if not user_email or not pet_id:
            return JsonResponse({"status": "error"})

        fav_ref = db.collection("UserFavPet").document(user_email)
        fav_doc = fav_ref.get()

        if fav_doc.exists:
            fav_data = fav_doc.to_dict()
            favs = fav_data.get("favorites", [])
            if pet_id in favs:
                favs.remove(pet_id)
                fav_ref.set({"favorites": favs})
                return JsonResponse({"status": "removed"})
            else:
                favs.append(pet_id)
                fav_ref.set({"favorites": favs})
                return JsonResponse({"status": "added"})
        else:
            fav_ref.set({"favorites": [pet_id]})
            return JsonResponse({"status": "added"})






def dogs(request):

    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")

    # Profil resmi çek
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel

    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break


    dog_pets = db.collection("Pets").where("category", "==", "Dogs").stream()
    dog_list = []

    for doc in dog_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Eğer sadece "bio" varsa ve "about" yoksa, fallback kullan:
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        dog_list.append(data)

    return render(request, 'dogs.html', {
        "dog_pets": dog_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })




def cats(request):
    
    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")

    # Profil resmi çek
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel

    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break


    cat_pets = db.collection("Pets").where("category", "==", "Cats").stream()
    cat_list = []

    for doc in cat_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Eğer sadece "bio" varsa ve "about" yoksa, fallback kullan:
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        cat_list.append(data)

    return render(request, 'cats.html', {
        "cat_pets": cat_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })

def birds(request):
    
    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")

    # Profil resmi çek
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel

    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break


    bird_pets = db.collection("Pets").where("category", "==", "Birds").stream()
    bird_list = []

    for doc in bird_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Eğer sadece "bio" varsa ve "about" yoksa, fallback kullan:
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        bird_list.append(data)

    return render(request, 'birds.html', {
        "bird_pets": bird_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })

def fishes(request):
    
    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")

    # Profil resmi çek
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel

    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break


    fish_pets = db.collection("Pets").where("category", "==", "Fishes").stream()
    fish_list = []

    for doc in fish_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Eğer sadece "bio" varsa ve "about" yoksa, fallback kullan:
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        fish_list.append(data)

    return render(request, 'fishes.html', {
        "fish_pets": fish_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })

def hamsters(request):
    
    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")

    # Profil resmi çek
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel

    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break


    hamster_pets = db.collection("Pets").where("category", "==", "Hamsters").stream()
    hamster_list = []

    for doc in hamster_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Eğer sadece "bio" varsa ve "about" yoksa, fallback kullan:
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        hamster_list.append(data)

    return render(request, 'hamsters.html', {
        "hamster_pets": hamster_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })

def others(request):
    
    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")

    # Profil resmi çek
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel

    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break


    other_pets = db.collection("Pets").where("category", "==", "Others").stream()
    other_list = []

    for doc in other_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Eğer sadece "bio" varsa ve "about" yoksa, fallback kullan:
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        other_list.append(data)

    return render(request, 'otherpets.html', {
        "other_pets": other_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })