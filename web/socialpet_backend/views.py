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


def get_cart_count(request):
    """Sepetteki toplam ürün sayısını hesapla"""
    cart_items = request.session.get('cart_items', [])
    return sum(item.get('quantity', 0) for item in cart_items)

def add_cart_context(context, request):
    """Tüm sayfalara cart count bilgisini ekle"""
    context['cart_count'] = get_cart_count(request)
    return context

def serve_web_index(request):
    context = {}
    return render(request, 'index.html', add_cart_context(context, request))

def serve_web_login(request):
    context = {}
    return render(request, 'login.html', add_cart_context(context, request))

def serve_web_register(request):
    context = {}
    return render(request, 'register.html', add_cart_context(context, request))

def serve_web_pet_profile(request):
    email = request.session.get("user_email")
    if not email:
        return redirect("/login/")
    
    context = {
        "user_email": email
    }
    return render(request, "pet-profile.html", add_cart_context(context, request))



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



def delete_event(request, event_id):
    if request.method == "POST":
        db.collection("Events").document(event_id).delete()
        return redirect("create_events")


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


def lost_pets(request):
    if request.method == "POST":
        name = request.POST.get("name")
        type_ = request.POST.get("type")
        breed = request.POST.get("breed")
        city = request.POST.get("city")
        town = request.POST.get("town")
        date = request.POST.get("date")  # YYYY-MM-DD formatında gelir
        explain = request.POST.get("explain")
        
        # Kullanıcının session'dan email'ini al
        user_email = request.session.get("user_email", "")
        
        if not user_email:
            # Eğer kullanıcı giriş yapmamışsa hata döner
            return redirect("/login/")

        image_url = ""
        if request.FILES.get("image"):
            image = request.FILES["image"]
            image_url = upload_to_firebase_storage(image, image.name)

        # Tarihi DD.MM.YYYY formatına çevir
        lost_date_formatted = ""
        if date:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(date, '%Y-%m-%d')
                lost_date_formatted = date_obj.strftime('%d.%m.%Y')
            except Exception as e:
                print(f"Tarih formatı hatası: {e}")
                lost_date_formatted = date

        doc_ref = db.collection("LostPets").document()
        doc_ref.set({
            "name": name,
            "type": type_,
            "breed": breed,
            "city": city,
            "town": town,
            "lostDate": lost_date_formatted,  # DD.MM.YYYY formatında
            "explain": explain,
            "user_email": user_email,  # Session'dan alınan email
            "image_url": image_url,
            "created_at": firestore.SERVER_TIMESTAMP,  # Oluşturulma tarihi de ekleyelim
        })
        return redirect("lost_pets")

    # Kullanıcı bilgileri
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

    pets_ref = db.collection('LostPets').stream()
    lost_pets_list = []
    for doc in pets_ref:
        data = doc.to_dict()
        data['image_url'] = data.get('image_url', 'https://placehold.co/400x400?text=Resim+Yok')
        
        # lostDate alanını işle
        lost_date = data.get('lostDate')
        if lost_date:
            try:
                from datetime import datetime
                # DD.MM.YYYY formatındaki tarihi parse et
                if isinstance(lost_date, str) and '.' in lost_date:
                    date_obj = datetime.strptime(lost_date, '%d.%m.%Y')
                    
                    # Türkçe tarih formatı oluştur
                    turk_aylar = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                                 "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
                    gun = date_obj.day
                    ay = turk_aylar[date_obj.month]
                    yil = date_obj.year
                    data['date_display'] = f"{gun} {ay} {yil}"
                else:
                    data['date_display'] = str(lost_date)
            except Exception as e:
                print(f"Tarih parse hatası: {e}")
                data['date_display'] = str(lost_date)
        else:
            data['date_display'] = "Tarih belirtilmemiş"
        
        lost_pets_list.append(data)
    return render(request, 'lost_pets.html', {
        'lost_pets': lost_pets_list,
        'user_pp': user_pp,
        'name': name,
        'email': email,
    })

def cart(request):
    email = request.session.get("user_email", "")
    name = request.session.get("user_name", "")
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # default görsel
    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break
    return render(request, 'cart.html', {
        "email": email,
        "name": name,
        "user_pp": user_pp,
    })

def food(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    
    # Fetch food products from Firestore
    products = []
    query = db.collection("Products").where("category", "==", "food").get()
    for doc in query:
        product = doc.to_dict()
        product["doc_id"] = doc.id
        products.append(product)

    return render(request, 'petshop/food.html', {
        'email': email,
        'name': name,
        'user_pp': user_pp,
        'products': products
    })

def toys(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    
    # Fetch toy products from Firestore
    products = []
    query = db.collection("Products").where("category", "==", "toys").get()
    for doc in query:
        product = doc.to_dict()
        product["doc_id"] = doc.id
        products.append(product)

    return render(request, 'petshop/toys.html', {
        'email': email,
        'name': name,
        'user_pp': user_pp,
        'products': products
    })

def accessories(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    
    # Fetch accessory products from Firestore
    products = []
    query = db.collection("Products").where("category", "==", "accessories").get()
    for doc in query:
        product = doc.to_dict()
        product["doc_id"] = doc.id
        products.append(product)

    return render(request, 'petshop/accessories.html', {
        'email': email,
        'name': name,
        'user_pp': user_pp,
        'products': products
    })

def health(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    
    # Fetch health products from Firestore
    products = []
    query = db.collection("Products").where("category", "==", "health").get()
    for doc in query:
        product = doc.to_dict()
        product["doc_id"] = doc.id
        products.append(product)

    return render(request, 'petshop/health.html', {
        'email': email,
        'name': name,
        'user_pp': user_pp,
        'products': products
    })


def nearby_vets(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    return render(request, "vet/nearby_vets.html", {
        'email': email,
        'name': name,
        'user_pp': user_pp
    })

def partner_vets(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    
    # Firebase'den veteriner verilerini çek
    vets = []
    try:
        vets_ref = db.collection("Vets")
        vets_docs = vets_ref.stream()
        
        for doc in vets_docs:
            vet_data = doc.to_dict()
            vet_data["doc_id"] = doc.id
            vets.append(vet_data)
    except Exception as e:
        print(f"Veteriner verileri çekilirken hata: {e}")
    
    # Firebase'den kullanıcının randevularını çek
    appointments = []
    if email:
        try:
            appointments_ref = db.collection("Appointments")
            user_appointments = appointments_ref.where("userEmail", "==", email).stream()
            
            for doc in user_appointments:
                appointment_data = doc.to_dict()
                appointment_data["doc_id"] = doc.id
                
                # Tarihi kontrol et - sadece gelecek tarihli randevuları al
                appointment_date_str = appointment_data.get("date", "")
                if appointment_date_str:
                    try:
                        # Tarih formatı: "26.05.2025" -> datetime object
                        from datetime import datetime
                        appointment_date = datetime.strptime(appointment_date_str, "%d.%m.%Y")
                        today = datetime.now()
                        
                        # Sadece gelecek tarihli randevuları ekle
                        if appointment_date.date() >= today.date():
                            appointments.append(appointment_data)
                    except ValueError:
                        # Tarih parse edilemezse skip et
                        continue
        except Exception as e:
            print(f"Randevu verileri çekilirken hata: {e}")
    
    return render(request, "vet/partner_vets.html", {
        'email': email,
        'name': name,
        'user_pp': user_pp,
        'vets': vets,
        'appointments': appointments
    })

from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def save_appointment(request):
    if request.method == 'POST':
        try:
            from datetime import datetime  # datetime import'unu en başa taşıdım
            data = json.loads(request.body)
            
            # Kullanıcı email'i session'dan al
            user_email = request.session.get('user_email')
            if not user_email:
                return JsonResponse({'success': False, 'error': 'Kullanıcı girişi gerekli'})
            
            # Randevu verilerini hazırla
            appointment_data = {
                'userEmail': user_email,
                'vetName': data.get('vetName'),
                'vetId': data.get('vetId'),
                'vetClinic': data.get('vetClinic'),
                'vetPhone': data.get('vetPhone'),
                'vetSpecialization': data.get('vetSpecialization'),
                'vetImage': data.get('vetImage', ''),
                'date': data.get('appointmentDate'),  # YYYY-MM-DD formatında
                'time': data.get('appointmentTime'),
                'petType': data.get('petType'),
                'petBreed': data.get('petBreed', ''),
                'petName': data.get('petName', ''),
                'reason': data.get('appointmentReason', ''),
                'status': 'pending',
                'createdAt': datetime.now()  # Firebase timestamp olarak kaydet
            }
            
            # Tarihi DD.MM.YYYY formatına çevir (Firebase'de bu format kullanılıyor)
            if appointment_data['date']:
                date_obj = datetime.strptime(appointment_data['date'], '%Y-%m-%d')
                appointment_data['date'] = date_obj.strftime('%d.%m.%Y')
            
            # Firebase'e kaydet
            appointments_ref = db.collection('Appointments')
            doc_ref = appointments_ref.add(appointment_data)
            
            return JsonResponse({
                'success': True, 
                'message': 'Randevu başarıyla oluşturuldu!',
                'appointment_id': doc_ref[1].id
            })
            
        except Exception as e:
            print(f"Randevu kaydetme hatası: {e}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Geçersiz istek metodu'})

def appointment(request):
    email = request.session.get('user_email')
    name = request.session.get('user_name')
    user_pp = None
    if email:
        user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
        if user_pets:
            pet_data = user_pets[0].to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            else:
                user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
        else:
            user_pp = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    return render(request, "vet/vet_appointment.html", {
        'email': email,
        'name': name,
        'user_pp': user_pp
    })

# Kullanıcının chat listesi
def chat_combined_view(request):
    user_email = request.session.get("user_email")
    if not user_email:
        return redirect("/login/")
    
    # Navbar için gerekli kullanıcı bilgileri
    user_name = request.session.get("user_name", "")
    user_pp = f"https://i.pravatar.cc/150?u={user_email}"  # varsayılan
    
    # Kullanıcının profil fotoğrafını Pets koleksiyonundan çek
    user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
    for pet in user_pets:
        pet_data = pet.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break
    
    chat_ref = db.collection('Chat')
    chats = chat_ref.where('userIds', 'array_contains', user_email).stream()
    chat_list = []
    active_chat_id = request.GET.get("chat_id")  # Sol menüden tıklanan
    selected_chat = None
    messages = []

    for chat in chats:
        chat_data = chat.to_dict()
        chat_id = chat.id
        other_user = next((u for u in chat_data['users'] if u['email'] != user_email), None)
        
        # Karşı tarafın gerçek kullanıcı adını Users koleksiyonundan al
        other_user_name = ""
        other_user_email = ""
        if other_user:
            other_user_email = other_user['email']
            # 1. Önce Users koleksiyonundan gerçek adı al
            try:
                users_query = db.collection("Users").where("email", "==", other_user_email).limit(1).get()
                for user_doc in users_query:
                    user_data = user_doc.to_dict()
                    other_user_name = user_data.get('name', '')
                    break
            except Exception as e:
                print(f"⚠️ Chat'te Users koleksiyonundan kullanıcı adı alınamadı: {e}")
            
            # 2. Users'ta bulunamadıysa Pets koleksiyonundan uname al
            if not other_user_name:
                try:
                    other_pets = db.collection("Pets").where("email", "==", other_user_email).limit(1).get()
                    for pet in other_pets:
                        pet_data = pet.to_dict()
                        other_user_name = pet_data.get('uname', '')
                        break
                except Exception as e:
                    print(f"⚠️ Chat'te Pets koleksiyonundan uname alınamadı: {e}")
            
            # 3. Hiçbiri yoksa email'i kullan
            if not other_user_name:
                other_user_name = other_user_email
        
        # pp çek
        other_pp = ""
        if other_user:
            other_pets = db.collection("Pets").where("email", "==", other_user['email']).limit(1).get()
            for pet in other_pets:
                other_pp = pet.to_dict().get("pp", "")
                break
            if not other_pp:
                other_pp = f"https://i.pravatar.cc/150?u={other_user['email']}"
        
        # Okunmamış mesaj kontrolü
        last_message_seen_by = chat_data.get('lastMessageSeenBy', [])
        has_unread = user_email not in last_message_seen_by and chat_data.get('lastMessage', '')
        
        # Son mesajın kim tarafından gönderildiğini kontrol et
        last_message = chat_data.get('lastMessage', '')
        last_message_display = last_message
        
        # Eğer son mesaj varsa ve çok uzunsa kısalt
        if last_message:
            if len(last_message) > 30:
                last_message_display = last_message[:30] + "..."
        
        chat_list.append({
            'id': chat_id,
            'other_name': other_user_name,
            'other_email': other_user_email,
            'other_pp': other_pp,
            'last_message': last_message_display,
            'has_unread': has_unread,  # Okunmamış mesaj var mı?
        })
        
        if active_chat_id == chat_id:
            selected_chat = {
                'id': chat_id,
                'other_name': other_user['name'] if other_user else "",
                'other_email': other_user['email'] if other_user else "",
                'other_pp': other_pp
            }
            
            # Kullanıcı bu sohbeti açtığında mesajları görmüş sayılır
            # lastMessageSeenBy alanını güncelle
            current_seen_by = chat_data.get('lastMessageSeenBy', [])
            if user_email not in current_seen_by:
                current_seen_by.append(user_email)
                db.collection('Chat').document(chat_id).update({
                    'lastMessageSeenBy': current_seen_by
                })
            
            # Mesajları da çek
            chat_doc = db.collection('Chat').document(chat_id)
            msgs_ref = chat_doc.collection('Messages').order_by('createdAt')
            for m in msgs_ref.stream():
                d = m.to_dict()
                sender_email = d['user'].get('_id')
                sender_name = d['user'].get('name', sender_email)
                msg_avatar = ""
                if sender_email == user_email:
                    user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
                    for pet in user_pets:
                        msg_avatar = pet.to_dict().get("pp", "")
                        break
                    if not msg_avatar:
                        msg_avatar = f"https://i.pravatar.cc/150?u={user_email}"
                else:
                    msg_avatar = other_pp
                messages.append({
                    'text': d.get('text', ''),
                    'user_email': sender_email,
                    'user_name': sender_name,
                    'avatar': msg_avatar,
                })

    return render(request, "chat_simple.html", {
        'chats': chat_list,
        'selected_chat': selected_chat,
        'messages': messages,
        'active_chat_id': active_chat_id,
        'email': user_email,
        'name': user_name,  # Navbar için eklendi
        'user_pp': user_pp  # Navbar için eklendi
    })


def chat_home(request):
    user_email = request.user.email
    chats_ref = db.collection('Chat')
    user_chats = chats_ref.where('userIds', 'array_contains', user_email).stream()
    chat_list = []

    for chat in user_chats:
        chat_data = chat.to_dict()
        # Karşı tarafı bul:
        other_users = [u for u in chat_data['users'] if u['email'] != user_email]
        chat_list.append({
            'chat_id': chat.id,
            'other_user': other_users[0] if other_users else {},
            'last_message': chat_data.get('lastMessage', ''),
            'last_message_time': chat_data.get('lastMessageTime', ''),
        })

    # Son mesaj zamanına göre sırala
    chat_list.sort(key=lambda x: x.get('last_message_time', ''), reverse=True)
    return render(request, 'chat_home.html', {'chats': chat_list})

def chat_simple_view(request):
    user_email = request.session.get("user_email")
    if not user_email:
        return redirect("/login/")
    chat_ref = db.collection('Chat')
    chats = chat_ref.where('userIds', 'array_contains', user_email).stream()
    chat_list = []
    for chat in chats:
        chat_data = chat.to_dict()
        chat_id = chat.id
        # Karşı tarafın bilgisi
        other_user = next((u for u in chat_data['users'] if u['email'] != user_email), None)
        other_pp = "https://i.pravatar.cc/150?u={}".format(other_user['email']) if other_user else ""
        # Karşı kullanıcının Pets koleksiyonundan pp çek
        if other_user:
            pets = db.collection("Pets").where("email", "==", other_user['email']).limit(1).get()
            for p in pets:
                pdata = p.to_dict()
                if pdata.get("pp"):
                    other_pp = pdata["pp"]

        chat_list.append({
            'id': chat_id,
            'other_name': other_user['name'] if other_user else '',
            'other_email': other_user['email'] if other_user else '',
            'other_pp': other_pp,
            'last_message': chat_data.get('lastMessage', ''),
        })
    return render(request, "chat_simple.html", {'chats': chat_list})

def chat_room_simple_view(request, chat_id):
    user_email = request.session.get("user_email")
    if not user_email:
        return redirect("/login/")
    chat_ref = db.collection('Chat').document(chat_id)
    chat_doc = chat_ref.get()
    if not chat_doc.exists:
        return redirect('/chat/')
    chat_data = chat_doc.to_dict()
    if user_email not in chat_data.get("userIds", []):
        return redirect('/chat/')

    # Karşı tarafı bul
    users = chat_data.get("users", [])
    other_user = None
    for u in users:
        if u.get("email") != user_email:
            other_user = u
            break

    # Karşı tarafın profil fotoğrafını Pets'ten çek
    avatar = ""
    if other_user:
        other_pets = db.collection("Pets").where("email", "==", other_user.get("email")).limit(1).get()
        for pet in other_pets:
            pet_data = pet.to_dict()
            avatar = pet_data.get("pp", "")
            break
        if not avatar:
            avatar = f"https://i.pravatar.cc/150?u={other_user.get('email')}"
        other_user["avatar"] = avatar

    # Mesajları çek
    messages = []
    msgs_ref = chat_ref.collection('Messages').order_by('createdAt')
    for m in msgs_ref.stream():
        d = m.to_dict()
        sender_email = d['user'].get('_id')
        sender_name = d['user'].get('name', sender_email)
        # Mesaj sahibi profil fotoğrafı
        msg_avatar = ""
        if sender_email == user_email:
            # Benim mesajım, kendi petimden çek
            user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
            for pet in user_pets:
                msg_avatar = pet.to_dict().get("pp", "")
                break
            if not msg_avatar:
                msg_avatar = f"https://i.pravatar.cc/150?u={user_email}"
        else:
            msg_avatar = avatar  # Diğer kişi
        messages.append({
            'text': d.get('text', ''),
            'user_email': sender_email,
            'user_name': sender_name,
            'avatar': msg_avatar,
            'createdAt': d.get('createdAt')
        })

    return render(request, "chat_room_simple.html", {
        'chat_id': chat_id,
        'messages': messages,
        'other_user': other_user
    })

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from firebase_admin import firestore

@csrf_exempt
def chat_send_message(request):
    print("######### chat_send_message ÇAĞRILDI #########")
    if not request.session.get("user_email"):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Login gerekli!'}, status=401)
        return redirect("/login/")
    
    if request.method == "POST":
        chat_id = request.POST.get('chat_id')
        text = request.POST.get('text')
        user_email = request.session.get("user_email")
        user_name = request.session.get("user_name", user_email)

        # PROFİL FOTOĞRAFINI AL (aynı cart gibi)
        user_pets = db.collection("Pets").where("email", "==", user_email).limit(1).get()
        user_pp = f"https://i.pravatar.cc/150?u={user_email}"  # varsayılan
        for doc in user_pets:
            pet_data = doc.to_dict()
            if pet_data.get("pp"):
                user_pp = pet_data["pp"]
            break

        chat_ref = db.collection('Chat').document(chat_id)
        msg_ref = chat_ref.collection('Messages')
        msg_ref.add({
            'text': text,
            'user': {
                '_id': user_email,
                'name': user_name,
                'avatar': user_pp    # <-- FOTOĞRAF BURAYA
            },
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        
        # lastMessageSeenBy alanını güncelle - mesaj gönderen kişi otomatik olarak görmüş sayılır
        chat_ref.update({
            'lastMessage': text,
            'lastMessageTime': firestore.SERVER_TIMESTAMP,
            'lastMessageSeenBy': [user_email]  # Sadece mesaj gönderen kişi görmüş sayılır
        })
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

def get_chat_messages(request, chat_id):
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"success": False, "error": "Login gerekli!"}, status=401)
    
    chat_ref = db.collection('Chat').document(chat_id)
    chat_doc = chat_ref.get()
    
    if chat_doc.exists:
        chat_data = chat_doc.to_dict()
        # Kullanıcı mesajları yüklediğinde görmüş sayılır
        current_seen_by = chat_data.get('lastMessageSeenBy', [])
        if user_email not in current_seen_by:
            current_seen_by.append(user_email)
            chat_ref.update({
                'lastMessageSeenBy': current_seen_by
            })
    
    msgs_ref = chat_ref.collection('Messages').order_by('createdAt')
    messages = []
    for m in msgs_ref.stream():
        d = m.to_dict()
        messages.append({
            'text': d.get('text', ''),
            'sender': d['user'].get('name', d['user'].get('_id')),
            'avatar': d['user'].get('avatar', ''),
            'createdAt': str(d.get('createdAt')) if d.get('createdAt') else '',
        })
    return JsonResponse({'success': True, 'messages': messages})

def test_view(request):
    raise Exception("BU VIEWS.PY ÇAĞRILDI!")

# --- ADMIN PANEL --- #
def adminpanel_view(request):
    if request.session.get("user_role") != "admin":
        return redirect("/login/")

    collection_names = [col.id for col in db.collections()]
    exclude_fields = ["createdAt", "created_at"]
    collection_data_list = []

    for name in collection_names:
        docs = []
        all_keys = set()
        for doc in db.collection(name).get():
            d = doc.to_dict()
            for field in exclude_fields:
                d.pop(field, None)
            d['doc_id'] = doc.id
            docs.append(d)
            all_keys.update(d.keys())
        all_keys = list(all_keys)
        # her dokümanda field sıralı dizi olarak ekle:
        for d in docs:
            d['fields'] = [d.get(k, "-") for k in all_keys]
        collection_data_list.append({
            "name": name,
            "docs": docs,
            "headers": all_keys
        })


    return render(request, "adminpanel.html", {
        "collection_data_list": collection_data_list
    })

def edit_user_view(request, email):
    if request.session.get("user_role") != "admin":
        return redirect("/login/")

    user_ref = db.collection("Users").where("email", "==", email).get()
    user_doc = None
    for doc in user_ref:
        user_doc = doc
        break

    if not user_doc:
        return render(request, "404.html")  # Kullanıcı yoksa

    user_data = user_doc.to_dict()

    if request.method == "POST":
        # Güncellenen rolü Firestore'a yaz
        new_role = request.POST.get("role")
        db.collection("Users").document(user_doc.id).update({"role": new_role})
        return redirect("/adminpanel/")

    return render(request, "edit_user.html", {"user": user_data})

def add_user_view(request):
    if request.session.get("user_role") != "admin":
        return redirect("/login/")

    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")
        name = request.POST.get("name")
        role = request.POST.get("role", "user")
        # Firestore'da unique key id oluşturmak için (örnek):
        import uuid
        doc_id = str(uuid.uuid4())
        db.collection("Users").document(doc_id).set({
            "id": doc_id,
            "email": email,
            "password": password,
            "name": name,
            "role": role
        })
        return redirect("/adminpanel/")
    return render(request, "add_user.html")

def delete_user_view(request, email):
    if request.session.get("user_role") != "admin":
        return redirect("/login/")

    # Kullanıcıyı Firestore'dan bul ve sil
    user_ref = db.collection("Users").where("email", "==", email).get()
    doc_id = None
    for doc in user_ref:
        doc_id = doc.id
        break
    if doc_id:
        db.collection("Users").document(doc_id).delete()
    return redirect("/adminpanel/")

def delete_document_view(request, collection, doc_id):
    if request.session.get("user_role") != "admin":
        return redirect("/login/")
    db.collection(collection).document(doc_id).delete()
    return redirect("/adminpanel/")

@csrf_exempt
def add_vet_view(request):
    """Admin panel - Yeni veteriner ekleme"""
    if request.method == "POST":
        try:
            # Form verilerini al
            name = request.POST.get("name", "").strip()
            specialization = request.POST.get("specialization", "").strip()
            phone = request.POST.get("phone", "").strip()
            clinic = request.POST.get("clinic", "").strip()
            address = request.POST.get("address", "").strip()
            experience = request.POST.get("experience", "").strip()
            rating = request.POST.get("rating", "").strip()
            image = request.POST.get("image", "").strip()
            
            # Zorunlu alan kontrolü
            if not name or not phone or not address:
                return JsonResponse({
                    "success": False, 
                    "error": "İsim, telefon ve adres alanları zorunludur."
                })
            
            # Veteriner verilerini hazırla
            vet_data = {
                "name": name,
                "phone": phone,
                "address": address,
                "createdAt": datetime.utcnow()
            }
            
            # İsteğe bağlı alanları ekle
            if specialization:
                vet_data["specialization"] = specialization
            if clinic:
                vet_data["clinic"] = clinic
            if experience:
                vet_data["experience"] = experience
            if rating:
                vet_data["rating"] = rating
            if image:
                vet_data["image"] = image
            
            # Firebase'e kaydet
            vets_ref = db.collection("Vets")
            doc_ref = vets_ref.add(vet_data)
            
            return JsonResponse({
                "success": True, 
                "message": "Veteriner başarıyla eklendi!",
                "doc_id": doc_ref[1].id
            })
            
        except Exception as e:
            print(f"Veteriner ekleme hatası: {e}")
            return JsonResponse({
                "success": False, 
                "error": f"Veteriner eklenirken hata oluştu: {str(e)}"
            })
    
    return JsonResponse({"success": False, "error": "Geçersiz istek metodu"})

# --- PETSHOP PANEL --- #
def petshop_panel_view(request):
    role = request.session.get("user_role")
    if role != "petshop":
        return redirect("/login/")

    # Hayvan türleri
    animal_types = ["Dogs", "Cats", "Birds", "Fishes", "Hamsters"]

    # Her hayvan türü için ürünleri al
    animal_products_list = []
    for animal in animal_types:
        products = []
        query = db.collection("Products").where("animalType", "==", animal).get()
        for doc in query:
            p = doc.to_dict()
            p["doc_id"] = doc.id
            products.append(p)
        animal_products_list.append({
            "name": animal,
            "products": products
        })

    return render(request, "petshop_panel.html", {
        "animal_products_list": animal_products_list
    })

def petshop_products_view(request):
    role = request.session.get("user_role")
    if role != "petshop":
        # Güvenlik için!
        if role == "admin":
            return redirect("/adminpanel/")
        elif role == "user":
            return redirect("/home/")
        else:
            return redirect("/login/")

    # Ürünleri Firestore'dan çek
    products_query = db.collection("Products").get()
    products = []
    for doc in products_query:
        product = doc.to_dict()
        product["doc_id"] = doc.id
        products.append(product)
    
    return render(request, "petshop_products.html", {"products": products})

def petshop_add_product(request):
    role = request.session.get("user_role")
    if role != "petshop":
        return redirect("/login/")

    if request.method == "POST":
        name = request.POST.get("name")
        price = request.POST.get("price")
        image = request.POST.get("image")
        description = request.POST.get("description")
        weight = request.POST.get("weight")
        animalType = request.POST.get("animalType")   # selectbox'tan gelen!
        category = request.POST.get("category")       # selectbox'tan gelen!
        import uuid
        doc_id = str(uuid.uuid4())
        db.collection("Products").document(doc_id).set({
            "id": doc_id,
            "name": name,
            "price": int(price),
            "image": image,
            "description": description,
            "weight": weight,
            "animalType": animalType,
            "category": category,
            "isFavorite": False
        })
        return redirect("/petshop/products/")

    return render(request, "petshop_add_product.html")

def petshop_edit_product(request, doc_id):
    role = request.session.get("user_role")
    if role != "petshop":
        return redirect("/login/")

    product_ref = db.collection("Products").document(doc_id)
    product = product_ref.get().to_dict()

    if request.method == "POST":
        product["name"] = request.POST.get("name")
        product["price"] = int(request.POST.get("price"))
        product["image"] = request.POST.get("image")
        product["description"] = request.POST.get("description")
        product["weight"] = request.POST.get("weight")
        product["animalType"] = request.POST.get("animalType")
        product["category"] = request.POST.get("category")
        product_ref.update(product)
        return redirect("/petshop/products/")

    return render(request, "petshop_edit_product.html", {"product": product, "doc_id": doc_id})

def petshop_delete_product(request, doc_id):
    role = request.session.get("user_role")
    if role != "petshop":
        return redirect("/login/")
    db.collection("Products").document(doc_id).delete()
    return redirect("/petshop/products/")

def petshop_edit_product(request, doc_id):
    role = request.session.get("user_role")
    if role != "petshop":
        return redirect("/login/")

    product_ref = db.collection("Products").document(doc_id)
    product_doc = product_ref.get()
    if not product_doc.exists:
        return redirect("/petshop/products/")
    product = product_doc.to_dict()

    if request.method == "POST":
        # Formdan gelen yeni verilerle güncelle
        update_data = {
            "name": request.POST.get("name"),
            "price": int(request.POST.get("price")),
            "image": request.POST.get("image"),
            "description": request.POST.get("description"),
            "weight": request.POST.get("weight"),
            "animalType": request.POST.get("animalType"),
            "category": request.POST.get("category"),
        }
        product_ref.update(update_data)
        return redirect("/petshop/products/")

    return render(request, "petshop_edit_product.html", {"product": product, "doc_id": doc_id})

@csrf_exempt
def get_cart_from_firestore(request):
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"items": []})
    doc = db.collection("Carts").document(user_email).get()
    items = doc.to_dict().get("items", []) if doc.exists else []
    return JsonResponse({"items": items})

@csrf_exempt
def save_cart_to_firestore(request):    
    user_email = request.session.get("user_email")
    if not user_email or request.method != "POST":
        return JsonResponse({"success": False})
    items = json.loads(request.body.decode()).get("items", [])
    db.collection("Carts").document(user_email).set({"items": items})
    return JsonResponse({"success": True})

@csrf_exempt
def add_to_cart(request):
    """Sepete ürün ekleme fonksiyonu"""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST gerekli"})
    
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"success": False, "message": "Giriş yapmanız gerekli"})
    
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        # Ürün bilgilerini Firestore'dan al
        product_doc = db.collection("Products").document(product_id).get()
        if not product_doc.exists:
            return JsonResponse({"success": False, "message": "Ürün bulunamadı"})
        
        product = product_doc.to_dict()
        
        # Mevcut sepeti al
        cart_doc = db.collection("Carts").document(user_email).get()
        items = cart_doc.to_dict().get("items", []) if cart_doc.exists else []
        
        # Aynı ürün var mı kontrol et
        found = False
        for item in items:
            if item.get('id') == product_id:
                item['quantity'] = min(item['quantity'] + quantity, 10)  # Max 10 adet
                found = True
                break
        
        # Yoksa yeni ürün ekle
        if not found:
            items.append({
                "id": product_id,
                "name": product.get('name'),
                "price": product.get('price'),
                "image": product.get('image'),
                "brand": product.get('brand', ''),
                "quantity": min(quantity, 10)
            })
        
        # Sepeti kaydet
        db.collection("Carts").document(user_email).set({"items": items})
        
        # Toplam sepet sayısını hesapla
        total_count = sum(item['quantity'] for item in items)
        
        return JsonResponse({
            "success": True, 
            "message": "Ürün sepete eklendi",
            "cart_count": total_count
        })
        
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Hata: {str(e)}"})

@csrf_exempt
def remove_from_cart(request):
    """Sepetten ürün silme fonksiyonu"""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST gerekli"})
    
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"success": False, "message": "Giriş yapmanız gerekli"})
    
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        
        # Mevcut sepeti al
        cart_doc = db.collection("Carts").document(user_email).get()
        items = cart_doc.to_dict().get("items", []) if cart_doc.exists else []
        
        # Ürünü listeden çıkar
        items = [item for item in items if item.get('id') != product_id]
        
        # Sepeti kaydet
        db.collection("Carts").document(user_email).set({"items": items})
        
        # Toplam sepet sayısını hesapla
        total_count = sum(item['quantity'] for item in items)
        
        return JsonResponse({
            "success": True, 
            "message": "Ürün sepetten çıkarıldı",
            "cart_count": total_count
        })
        
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Hata: {str(e)}"})

@csrf_exempt
def update_cart_quantity(request):
    """Sepetteki ürün miktarını güncelleme fonksiyonu"""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST gerekli"})
    
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"success": False, "message": "Giriş yapmanız gerekli"})
    
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        new_quantity = int(data.get('quantity', 1))
        
        # Miktar kontrolü
        if new_quantity < 1:
            new_quantity = 1
        elif new_quantity > 10:
            new_quantity = 10
        
        # Mevcut sepeti al
        cart_doc = db.collection("Carts").document(user_email).get()
        items = cart_doc.to_dict().get("items", []) if cart_doc.exists else []
        
        # Ürünü bul ve miktarını güncelle
        for item in items:
            if item.get('id') == product_id:
                item['quantity'] = new_quantity
                break
        
        # Sepeti kaydet
        db.collection("Carts").document(user_email).set({"items": items})
        
        # Toplam sepet sayısını hesapla
        total_count = sum(item['quantity'] for item in items)
        
        return JsonResponse({
            "success": True, 
            "message": "Miktar güncellendi",
            "cart_count": total_count
        })
        
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Hata: {str(e)}"})

@csrf_exempt
def clear_cart(request):
    """Sepeti tamamen temizleme fonksiyonu"""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST gerekli"})
    
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"success": False, "message": "Giriş yapmanız gerekli"})
    
    try:
        # Sepeti temizle
        db.collection("Carts").document(user_email).set({"items": []})
        
        return JsonResponse({
            "success": True, 
            "message": "Sepet temizlendi",
            "cart_count": 0
        })
        
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Hata: {str(e)}"})

@csrf_exempt
def get_cart_count(request):
    """Sepetteki toplam ürün sayısını getirme fonksiyonu"""
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({"cart_count": 0})
    
    try:
        cart_doc = db.collection("Carts").document(user_email).get()
        items = cart_doc.to_dict().get("items", []) if cart_doc.exists else []
        total_count = sum(item['quantity'] for item in items)
        
        return JsonResponse({"cart_count": total_count})
        
    except Exception as e:
        return JsonResponse({"cart_count": 0})

@csrf_exempt
def delete_appointment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            appointment_id = data.get('appointment_id')
            
            # Kullanıcı email'i session'dan al
            user_email = request.session.get('user_email')
            if not user_email:
                return JsonResponse({'success': False, 'error': 'Kullanıcı girişi gerekli'})
            
            if not appointment_id:
                return JsonResponse({'success': False, 'error': 'Randevu ID gerekli'})
            
            # Firebase'den randevuyu al ve kullanıcı kontrolü yap
            appointment_ref = db.collection('Appointments').document(appointment_id)
            appointment_doc = appointment_ref.get()
            
            if not appointment_doc.exists:
                return JsonResponse({'success': False, 'error': 'Randevu bulunamadı'})
            
            appointment_data = appointment_doc.to_dict()
            
            # Sadece kendi randevusunu silebilir
            if appointment_data.get('userEmail') != user_email:
                return JsonResponse({'success': False, 'error': 'Bu randevuyu silme yetkiniz yok'})
            
            # Firebase'den sil
            appointment_ref.delete()
            
            return JsonResponse({
                'success': True, 
                'message': 'Randevu başarıyla silindi!'
            })
            
        except Exception as e:
            print(f"Randevu silme hatası: {e}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Geçersiz istek metodu'})

@csrf_exempt
def start_or_get_chat(request):
    """İki kullanıcı arasında chat başlatır veya mevcut chat'i döner"""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            current_user_email = request.session.get("user_email")
            target_user_email = data.get("target_user_email")
            
            if not current_user_email:
                return JsonResponse({'success': False, 'error': 'Giriş yapmanız gerekli'})
            
            if not target_user_email:
                return JsonResponse({'success': False, 'error': 'Hedef kullanıcı email\'i gerekli'})
            
            if current_user_email == target_user_email:
                return JsonResponse({'success': False, 'error': 'Kendinizle sohbet başlatamazsınız'})
            
            # Chat ID'sini oluştur (alfabetik sıralama ile tutarlılık için)
            emails = sorted([current_user_email, target_user_email])
            chat_id = f"{emails[0]}_{emails[1]}"
            
            # Mevcut chat var mı kontrol et
            chat_ref = db.collection('Chat').document(chat_id)
            chat_doc = chat_ref.get()
            
            if chat_doc.exists:
                # Mevcut chat varsa ID'sini döner
                return JsonResponse({
                    'success': True, 
                    'chat_id': chat_id,
                    'message': 'Mevcut sohbete yönlendiriliyorsunuz'
                })
            else:
                # Yeni chat oluştur
                # Current user bilgilerini Users koleksiyonundan al
                current_user_name = ""
                try:
                    users_query = db.collection("Users").where("email", "==", current_user_email).limit(1).get()
                    for user_doc in users_query:
                        user_data = user_doc.to_dict()
                        current_user_name = user_data.get('name', '')
                        break
                except Exception as e:
                    print(f"⚠️ Current user Users koleksiyonundan adı alınamadı: {e}")
                
                # Users'ta bulunamadıysa Pets koleksiyonundan uname al
                if not current_user_name:
                    try:
                        user_pets = db.collection("Pets").where("email", "==", current_user_email).limit(1).get()
                        for pet in user_pets:
                            pet_data = pet.to_dict()
                            current_user_name = pet_data.get('uname', '')
                            break
                    except Exception as e:
                        print(f"⚠️ Current user Pets koleksiyonundan uname alınamadı: {e}")
                
                # Hiçbiri yoksa email'i kullan
                if not current_user_name:
                    current_user_name = current_user_email
                
                current_user_pp = f"https://i.pravatar.cc/150?u={current_user_email}"
                
                # Current user'ın profil fotoğrafını al
                user_pets = db.collection("Pets").where("email", "==", current_user_email).limit(1).get()
                for pet in user_pets:
                    pet_data = pet.to_dict()
                    if pet_data.get("pp"):
                        current_user_pp = pet_data["pp"]
                    break
                
                # Target user bilgilerini Users ve Pets koleksiyonlarından al
                target_user_name = ""
                target_user_pp = f"https://i.pravatar.cc/150?u={target_user_email}"
                
                # 1. Önce Users koleksiyonundan gerçek adını al
                try:
                    users_query = db.collection("Users").where("email", "==", target_user_email).limit(1).get()
                    for user_doc in users_query:
                        user_data = user_doc.to_dict()
                        target_user_name = user_data.get('name', '')
                        break
                except Exception as e:
                    print(f"⚠️ Target user Users koleksiyonundan adı alınamadı: {e}")
                
                # 2. Users'ta bulunamadıysa Pets koleksiyonundan uname ve pp al
                if not target_user_name:
                    try:
                        target_pets = db.collection("Pets").where("email", "==", target_user_email).limit(1).get()
                        for pet in target_pets:
                            pet_data = pet.to_dict()
                            target_user_name = pet_data.get('uname', '')
                            if pet_data.get("pp"):
                                target_user_pp = pet_data["pp"]
                            break
                    except Exception as e:
                        print(f"⚠️ Target user Pets koleksiyonundan uname alınamadı: {e}")
                else:
                    # Users'ta bulunduysa sadece pp'yi Pets'ten al
                    try:
                        target_pets = db.collection("Pets").where("email", "==", target_user_email).limit(1).get()
                        for pet in target_pets:
                            pet_data = pet.to_dict()
                            if pet_data.get("pp"):
                                target_user_pp = pet_data["pp"]
                            break
                    except Exception as e:
                        print(f"⚠️ Target user pp alınamadı: {e}")
                
                # 3. Hiçbiri yoksa email'i kullan
                if not target_user_name:
                    target_user_name = target_user_email
                
                # Yeni chat oluştur
                chat_data = {
                    'userIds': [current_user_email, target_user_email],
                    'users': [
                        {
                            'email': current_user_email,
                            'name': current_user_name,
                            'pp': current_user_pp
                        },
                        {
                            'email': target_user_email,
                            'name': target_user_name,
                            'pp': target_user_pp
                        }
                    ],
                    'lastMessage': '',
                    'lastMessageTime': firestore.SERVER_TIMESTAMP,
                    'lastMessageSeenBy': [],
                    'createdAt': firestore.SERVER_TIMESTAMP
                }
                
                chat_ref.set(chat_data)
                
                return JsonResponse({
                    'success': True, 
                    'chat_id': chat_id,
                    'message': 'Yeni sohbet oluşturuldu'
                })
                
        except Exception as e:
            print(f"Chat başlatma hatası: {e}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Geçersiz istek metodu'})

@csrf_exempt
def save_like_dislike(request):
    """Like/Dislike işlemlerini Firebase'e kaydeder ve eşleşme kontrolü yapar"""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            current_user_email = request.session.get("user_email")
            target_pet_id = data.get("target_pet_id")
            action = data.get("action")  # "like" veya "dislike"
            
            print(f"🎯 Like/Dislike isteği: {current_user_email} -> Pet: {target_pet_id}, Action: {action}")
            
            if not current_user_email or not target_pet_id or not action:
                return JsonResponse({'success': False, 'error': 'Eksik parametreler'})
            
            # Hedef pet'in bilgilerini al
            target_pet_doc = db.collection("Pets").document(target_pet_id).get()
            if not target_pet_doc.exists:
                return JsonResponse({'success': False, 'error': 'Pet bulunamadı'})
            
            target_pet_data = target_pet_doc.to_dict()
            target_user_email = target_pet_data.get("email")
            target_pet_category = target_pet_data.get("category")
            
            print(f"🎯 Hedef pet: {target_pet_data.get('name', 'İsimsiz')} - Sahip: {target_user_email} - Kategori: {target_pet_category}")
            
            # Kendi petini beğenmeye çalışıyor mu kontrol et
            if target_user_email == current_user_email:
                return JsonResponse({'success': False, 'error': 'Kendi petinizi beğenemezsiniz'})
            
            # Mevcut kullanıcının herhangi bir petini al (kategori kontrolü kaldırıldı)
            current_user_pets = db.collection("Pets").where("email", "==", current_user_email).limit(1).get()
            
            if not current_user_pets:
                return JsonResponse({'success': False, 'error': 'Hiç pet\'iniz yok'})
            
            current_pet_doc = current_user_pets[0]
            current_pet_data = current_pet_doc.to_dict()
            current_pet_id = current_pet_doc.id
            
            print(f"🎯 Mevcut kullanıcının peti: {current_pet_data.get('name', 'İsimsiz')} - ID: {current_pet_id}")
            
            # Sadece like işlemlerini kaydet (dislike kaydetmiyoruz)
            if action == "like":
                # Like kontrolünü kaldırdık - kullanıcı aynı pet'i birden fazla beğenebilir
                print(f"💖 Like kaydediliyor: {current_user_email} -> {target_pet_id}")
                
                # 1. Like'ı Likes koleksiyonuna kaydet
                like_data = {
                    'from': current_user_email,
                    'to': target_user_email,
                    'petId': target_pet_id,
                    'petCategory': target_pet_category,
                    'createdAt': firestore.SERVER_TIMESTAMP
                }
                
                like_ref = db.collection("Likes").add(like_data)
                print(f"✅ Like kaydedildi: {like_ref[1].id}")
                
                # 2. Karşılıklı like kontrolü yap - SADECE AYNI KATEGORİDE
                # Karşı tarafın bu kullanıcının aynı kategorideki petini like'layıp like'lamadığını kontrol et
                reverse_likes_query = list(db.collection("Likes").where("from", "==", target_user_email).where("to", "==", current_user_email).where("petCategory", "==", target_pet_category).get())
                
                print(f"🔍 Aynı kategoride ({target_pet_category}) karşılıklı like kontrolü: {len(reverse_likes_query)} adet bulundu")
                
                if reverse_likes_query:  # Aynı kategoride karşılıklı like var
                    print(f"💕 Aynı kategoride karşılıklı like bulundu!")
                    
                    # Daha önce bu kategoride match oluşturulmuş mu kontrol et
                    existing_match_query = list(db.collection("matches").where("users", "array_contains", current_user_email).where("category", "==", target_pet_category).get())
                    
                    already_matched = False
                    for match_doc in existing_match_query:
                        match_data = match_doc.to_dict()
                        if target_user_email in match_data.get("users", []):
                            already_matched = True
                            print(f"⚠️ Bu kullanıcılarla bu kategoride ({target_pet_category}) zaten match var")
                            break
                    
                    if not already_matched:
                        # Mevcut kullanıcının aynı kategorideki petini bul
                        current_user_same_category_pets = list(db.collection("Pets").where("email", "==", current_user_email).where("category", "==", target_pet_category).limit(1).get())
                        
                        if current_user_same_category_pets:
                            current_pet_doc = current_user_same_category_pets[0]
                            current_pet_data = current_pet_doc.to_dict()
                            current_pet_id = current_pet_doc.id
                            
                            # Yeni match oluştur - "matches" koleksiyonuna kaydet
                            match_data = {
                                'users': [current_user_email, target_user_email],
                                'category': target_pet_category,
                                'createdAt': firestore.SERVER_TIMESTAMP,
                                'pets': [
                                    {
                                        'owner': current_user_email,
                                        'id': current_pet_id,
                                        'name': current_pet_data.get('name', current_pet_data.get('uname', '')),
                                        'category': current_pet_data.get('category', ''),
                                        'imageUrl': current_pet_data.get('imageUrl', current_pet_data.get('pp', ''))
                                    },
                                    {
                                        'owner': target_user_email,
                                        'id': target_pet_id,
                                        'name': target_pet_data.get('name', target_pet_data.get('uname', '')),
                                        'category': target_pet_data.get('category', ''),
                                        'imageUrl': target_pet_data.get('imageUrl', target_pet_data.get('pp', ''))
                                    }
                                ]
                            }
                            
                            match_ref = db.collection("matches").add(match_data)
                            print(f"🎉 YENİ MATCH OLUŞTURULDU ({target_pet_category} kategorisinde): {match_ref[1].id}")
                            print(f"🎉 Match verileri: {match_data}")
                            
                            # Karşı tarafın kullanıcı adını önce Users koleksiyonundan al
                            target_user_name = ""
                            try:
                                users_query = db.collection("Users").where("email", "==", target_user_email).limit(1).get()
                                for user_doc in users_query:
                                    user_data = user_doc.to_dict()
                                    target_user_name = user_data.get('name', '')
                                    break
                            except Exception as e:
                                print(f"⚠️ Match'te Users koleksiyonundan kullanıcı adı alınamadı: {e}")
                            
                            # Users'ta bulunamadıysa Pets koleksiyonundan uname al
                            if not target_user_name:
                                try:
                                    target_pets = db.collection("Pets").where("email", "==", target_user_email).limit(1).get()
                                    for pet in target_pets:
                                        pet_data = pet.to_dict()
                                        target_user_name = pet_data.get('uname', '')
                                        break
                                except Exception as e:
                                    print(f"⚠️ Match'te Pets koleksiyonundan uname alınamadı: {e}")
                            
                            # Hiçbiri yoksa email'i kullan
                            if not target_user_name:
                                target_user_name = target_user_email
                            
                            return JsonResponse({
                                'success': True, 
                                'match': True,
                                'match_data': {
                                    'pet_name': target_pet_data.get('name', target_pet_data.get('uname', '')),
                                    'pet_image': target_pet_data.get('imageUrl', target_pet_data.get('pp', '')),
                                    'owner_name': target_user_name,
                                    'owner_email': target_user_email
                                }
                            })
                        else:
                            print(f"⚠️ Kullanıcının {target_pet_category} kategorisinde peti yok")
                            return JsonResponse({'success': True, 'match': False, 'message': f'{target_pet_category} kategorisinde petiniz yok'})
                    else:
                        return JsonResponse({'success': True, 'match': False, 'message': 'Bu kategoride zaten eşleşmiş'})
                else:
                    print(f"💔 {target_pet_category} kategorisinde henüz karşılıklı like yok")
            
            return JsonResponse({'success': True, 'match': False, 'message': 'Like kaydedildi'})
            
        except Exception as e:
            print(f"❌ Like/Dislike kaydetme hatası: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Geçersiz istek metodu'})

@csrf_exempt
def get_user_matches(request):
    """Kullanıcının eşleşmelerini getirir"""
    user_email = request.session.get("user_email")
    if not user_email:
        return JsonResponse({'success': False, 'error': 'Giriş yapmanız gerekli'})
    
    try:
        matches_ref = db.collection("matches").where("users", "array_contains", user_email)
        matches = []
        
        for doc in matches_ref.stream():
            match_data = doc.to_dict()
            match_data['id'] = doc.id
            
            # Karşı tarafın pet bilgilerini bul
            other_pet = None
            for pet in match_data.get('pets', []):
                if pet.get('owner') != user_email:
                    other_pet = pet
                    break
            
            if other_pet:
                matches.append({
                    'match_id': doc.id,
                    'pet_name': other_pet.get('name', ''),
                    'pet_image': other_pet.get('imageUrl', ''),
                    'owner_email': other_pet.get('owner', ''),
                    'category': match_data.get('category', ''),
                    'created_at': match_data.get('createdAt', '')
                })
        
        return JsonResponse({'success': True, 'matches': matches})
        
    except Exception as e:
        print(f"Eşleşmeleri getirme hatası: {e}")
        return JsonResponse({'success': False, 'error': str(e)})