import os
from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render, redirect
from django.http import JsonResponse
import json
from django.shortcuts import render, redirect
from datetime import datetime, timezone
from firebase_init import db, upload_to_firebase_storage
import uuid
from django.contrib import messages
import locale

import firebase_admin
from firebase_admin import credentials, firestore
from django.contrib.auth.decorators import login_required
from django.utils.safestring import mark_safe



# Türkçe tarih formatı için locale ayarla
try:
    locale.setlocale(locale.LC_TIME, "tr_TR.UTF-8")
except locale.Error:
    locale.setlocale(locale.LC_TIME, "tr_TR")


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


    favorite_ids = []
    if email:
        fav_doc = db.collection("UserFavPet").document(email).get()
        if fav_doc.exists:
            favorite_ids = fav_doc.to_dict().get("favorites", [])


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
        data["is_favorite"] = doc.id in favorite_ids 
        data["id"] = doc.id  # 🧠 HTML'deki data-pet-id için
        data["is_favorite"] = doc.id in favorite_ids # 🔥 Favori mi kontrolü
        
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

    favorite_ids = []
    if email:
        fav_doc = db.collection("UserFavPet").document(email).get()
        if fav_doc.exists:
            favorite_ids = fav_doc.to_dict().get("favorites", [])


    cat_pets = db.collection("Pets").where("category", "==", "Cats").stream()
    cat_list = []

    for doc in cat_pets:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        data["is_favorite"] = doc.id in favorite_ids  # ✅ EKLENDİ
        
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

    favorite_ids = []
    if email:
        fav_doc = db.collection("UserFavPet").document(email).get()
        if fav_doc.exists:
            favorite_ids = fav_doc.to_dict().get("favorites", [])

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
        data["is_favorite"] = doc.id in favorite_ids
        data["id"] = doc.id
        data["is_favorite"] = doc.id in favorite_ids
        
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

    favorite_ids = []
    if email:
        fav_doc = db.collection("UserFavPet").document(email).get()
        if fav_doc.exists:
            favorite_ids = fav_doc.to_dict().get("favorites", [])

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
        data["is_favorite"] = doc.id in favorite_ids
        data["id"] = doc.id
        data["is_favorite"] = doc.id in favorite_ids
        
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

    favorite_ids = []
    if email:
        fav_doc = db.collection("UserFavPet").document(email).get()
        if fav_doc.exists:
            favorite_ids = fav_doc.to_dict().get("favorites", [])

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
        data["is_favorite"] = doc.id in favorite_ids
        data["id"] = doc.id
        data["is_favorite"] = doc.id in favorite_ids
        
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

    favorite_ids = []
    if email:
        fav_doc = db.collection("UserFavPet").document(email).get()
        if fav_doc.exists:
            favorite_ids = fav_doc.to_dict().get("favorites", [])

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
        data["is_favorite"] = doc.id in favorite_ids
        data["id"] = doc.id
        data["is_favorite"] = doc.id in favorite_ids
        
        if "about" not in data and "bio" in data:
            data["about"] = data["bio"]
        
        other_list.append(data)

    return render(request, 'otherpets.html', {
        "other_pets": other_list,
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })

def favorites(request):
    user_email = request.session.get("user_email")
    if not user_email:
        return redirect("/login/")

    try:
        # Kullanıcı bilgilerini al
        name = request.session.get("user_name", "")
        
        # Profil resmi çek
        user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
        user_pp = f"https://i.pravatar.cc/150?u={user_email}"  # default görsel

        for doc in user_pets:
            pet_data = doc.to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            break

        # Favori hayvanları çek
        doc_ref = db.collection("UserFavPet").document(user_email)
        doc = doc_ref.get()

        if not doc.exists:
            favorites = []
        else:
            data = doc.to_dict()
            favorites = data.get("favorites", [])

        pets = []
        for pet_id in favorites:
            pet_doc = db.collection("Pets").document(pet_id).get()
            if pet_doc.exists:
                pet_data = pet_doc.to_dict()
                pet_data['id'] = pet_id
                
                # Tarih verilerini string'e çevir
                for key, value in pet_data.items():
                    if hasattr(value, 'isoformat'):  # Datetime nesnesi kontrolü
                        pet_data[key] = value.isoformat()
                
                pets.append(pet_data)

        return render(request, "favorites.html", {
            "pets": pets,
            "email": user_email,
            "name": name,
            "user_pp": user_pp
        })
    except Exception as e:
        print("Favorilerde hata:", e)
        return render(request, "favorites.html", {
            "pets": [],
            "email": user_email,
            "name": name,
            "user_pp": user_pp
        })
    

def upcoming_events(request):
    events_ref = db.collection("Events").order_by("date")
    events = []
    now = datetime.now(timezone.utc)
    user_email = request.session.get("user_email", "")
    
    for doc in events_ref.stream():
        event = doc.to_dict()
        event["id"] = doc.id

        # Tarih kontrolü
        raw_date = event.get("date")
        if isinstance(raw_date, str):
            try:
                event_date = datetime.fromisoformat(raw_date)
            except Exception:
                event_date = datetime.strptime(raw_date.split("T")[0], "%Y-%m-%d")
        else:
            event_date = raw_date
        if hasattr(event_date, "tzinfo") and event_date.tzinfo is None:
            event_date = event_date.replace(tzinfo=timezone.utc)
        
        if event_date > now:
            # Katılımcıları EventParticipants'tan al
            participants_doc = db.collection("EventParticipants").document(event["id"]).get()
            participants = participants_doc.to_dict().get("participants", []) if participants_doc.exists else []
            participants_count = len(participants)
            user_joined = user_email in participants
            unlimited = event.get("unlimited", False)
            capacity = event.get("capacity", 0)
            # Sınırsız ise asla dolmaz
            is_full = (not unlimited and capacity and participants_count >= int(capacity))

            events.append({
                "id": event["id"],
                "title": event.get("title", ""),
                "date": event_date.strftime("%Y-%m-%d"),
                "time": event.get("time", ""),
                "location": f'{event.get("city", "")} / {event.get("district", "")}',
                "capacity": capacity if not unlimited else "Sınırsız",
                "participants_count": participants_count,
                "description": event.get("description", ""),
                "user_joined": user_joined,
                "is_full": is_full,
                "unlimited": unlimited,
            })

    # Kullanıcı profil bilgisi
    user_name = request.session.get("user_name", "")
    user_pp = f"https://i.pravatar.cc/150?u={user_email}"
    user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break

    return render(request, 'events/upcoming_events.html', {
        "events": mark_safe(json.dumps(events)),
        "email": user_email,
        "name": user_name,
        "user_pp": user_pp,
    })


def join_event(request, event_id):
    if request.method == "POST":
        user_email = request.session.get("user_email")
        if not user_email:
            return JsonResponse({"status": "error", "message": "Lütfen giriş yapın"})
        
        event_ref = db.collection("Events").document(event_id)
        event_doc = event_ref.get()
        if not event_doc.exists:
            return JsonResponse({"status": "error", "message": "Etkinlik bulunamadı."})
        
        event_data = event_doc.to_dict()
        unlimited = event_data.get("unlimited", False)
        capacity = event_data.get("capacity", 0)

        # EventParticipants'tan katılımcı listesi al
        participants_ref = db.collection("EventParticipants").document(event_id)
        participants_doc = participants_ref.get()
        participants = participants_doc.to_dict().get("participants", []) if participants_doc.exists else []

        if user_email in participants:
            participants.remove(user_email)
            action = "left"
        else:
            if not unlimited and capacity and len(participants) >= int(capacity):
                return JsonResponse({"status": "error", "message": "Kontenjan doldu!"})
            participants.append(user_email)
            action = "joined"
        participants_ref.set({"participants": participants})

        # Events koleksiyonundaki participants alanını da güncelle
        event_participants = event_data.get("participants", [])
        if user_email in event_participants:
            event_participants.remove(user_email)
        else:
            event_participants.append(user_email)
        event_ref.update({"participants": event_participants})

        return JsonResponse({"status": "success", "action": action})
    return JsonResponse({"status": "error", "message": "Geçersiz istek"})


def past_events(request):
    events_ref = db.collection("Events").order_by("date")
    events = []
    now = datetime.now(timezone.utc)
    for doc in events_ref.stream():
        event = doc.to_dict()
        event["id"] = doc.id
        raw_date = event.get("date")
        if isinstance(raw_date, str):
            try:
                event_date = datetime.fromisoformat(raw_date)
            except Exception:
                event_date = datetime.strptime(raw_date.split("T")[0], "%Y-%m-%d")
        else:
            event_date = raw_date
        if hasattr(event_date, "tzinfo") and event_date.tzinfo is None:
            event_date = event_date.replace(tzinfo=timezone.utc)
        if event_date <= now:
            # Get participants count
            participants_ref = db.collection("EventParticipants").document(event["id"])
            participants_doc = participants_ref.get()
            participants_count = len(participants_doc.to_dict().get("participants", [])) if participants_doc.exists else 0
            
            events.append({
                "id": event["id"],
                "title": event.get("title", ""),
                "date": event_date.strftime("%Y-%m-%d"),
                "time": event.get("time", ""),
                "location": f'{event.get("city", "")} / {event.get("district", "")}',
                "capacity": event.get("capacity", "Sınırsız") if not event.get("unlimited", False) else "Sınırsız",
                "participants_count": participants_count,
                "description": event.get("description", "")
            })
    user_email = request.session.get("user_email", "")
    user_name = request.session.get("user_name", "")
    user_pp = f"https://i.pravatar.cc/150?u={user_email}"
    user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break
    return render(request, 'events/past_events.html', {
        "events": mark_safe(json.dumps(events)),
        "email": user_email,
        "name": user_name,
        "user_pp": user_pp,
    })

def create_events(request):
    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description")
        city = request.POST.get("city")
        district = request.POST.get("district")
        pet_type = request.POST.get("pet_type")
        time_str = request.POST.get("time")
        date_str = request.POST.get("date")
        combined_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        capacity = request.POST.get("capacity")
        unlimited = request.POST.get("unlimited") == "on"
        created_by = request.session.get("user_name", "Anonim")
        email = request.session.get("user_email", "anonim@example.com")
        db.collection("Events").add({
            "title": title,
            "description": description,
            "city": city,
            "district": district,
            "pet_type": pet_type,
            "time": time_str,
            "date": combined_datetime.isoformat(),
            "created_at": datetime.now(),
            "created_by": created_by,
            "email": email,
            "participants": [],  # Katılımcı listesi başta boş
            "capacity": int(capacity) if capacity else None,
            "unlimited": unlimited,
        })
        return redirect("create_events")
    user_email = request.session.get("user_email")
    if not user_email:
        return redirect("/login/")
    events_ref = db.collection("Events").where("email", "==", user_email)
    events = []
    for doc in events_ref.stream():
        event = doc.to_dict()
        event["id"] = doc.id
        raw_date = event.get("date")
        if isinstance(raw_date, str):
            try:
                event_date = datetime.fromisoformat(raw_date)
            except:
                event_date = datetime.strptime(raw_date.split("T")[0], "%Y-%m-%d")
        else:
            event_date = raw_date
        if event_date.tzinfo is None:
            event_date = event_date.replace(tzinfo=timezone.utc)
        turk_aylar = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
        gun = event_date.day
        ay = turk_aylar[event_date.month]
        yil = event_date.year
        event["date_display"] = f"{gun} {ay} {yil}"
        event["date_for_sort"] = event_date
        event["is_future"] = event_date > datetime.now(timezone.utc)
        pet_type_map = {"Cats": "Kedi", "Dogs": "Köpek", "Birds": "Kuş", "Fishes": "Balık", "Hamsters": "Hamster", "Others": "Diğer"}
        event["pet_type_display"] = pet_type_map.get(event.get("pet_type"), event.get("pet_type"))
        events.append(event)
    events.sort(key=lambda x: x["date_for_sort"])
    user_name = request.session.get("user_name", "")
    user_pp = f"https://i.pravatar.cc/150?u={user_email}"
    user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break
    return render(request, 'events/create_events.html', {
        "events": events,
        "email": user_email,
        "name": user_name,
        "user_pp": user_pp,
    })

from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def edit_event(request, event_id):
    if request.method == "POST":
        data = request.POST
        event_ref = db.collection("Events").document(event_id)
        # Tarih ve saat birleştir
        date_str = data.get("date")
        time_str = data.get("time")
        combined_datetime = None
        if date_str and time_str:
            try:
                combined_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            except Exception:
                combined_datetime = None
        # Kontenjan ve sınırsız
        capacity = data.get("capacity")
        unlimited = data.get("unlimited") == "on"
        update_data = {
            "title": data.get("title"),
            "description": data.get("description"),
            "city": data.get("city"),
            "district": data.get("district"),
            "pet_type": data.get("pet_type"),
            "time": time_str,
            "date": combined_datetime.isoformat() if combined_datetime else data.get("date"),
            "capacity": capacity,
            "unlimited": unlimited,
        }
        event_ref.update(update_data)
        return redirect("create_events")


@csrf_exempt
def delete_event(request, event_id):
    if request.method == "POST":
        db.collection("Events").document(event_id).delete()
        return redirect("create_events")

@csrf_exempt
def check_participation(request, event_id):
    if request.method == "GET":
        user_email = request.session.get("user_email")
        if not user_email:
            return JsonResponse({"status": "error", "message": "Lütfen giriş yapın"})
            
        participants_ref = db.collection("EventParticipants").document(event_id)
        participants_doc = participants_ref.get()
        
        if not participants_doc.exists:
            return JsonResponse({"is_participating": False})
            
        participants = participants_doc.to_dict().get("participants", [])
        return JsonResponse({"is_participating": user_email in participants})
            
    return JsonResponse({"status": "error", "message": "Geçersiz istek"})

