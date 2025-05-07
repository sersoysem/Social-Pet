#Sayfa Çağırma İşlemleri
def register_page(request):
    return render(request, 'register.html')

def home_view(request):
    email = request.session.get("user_email", "Giriş yapılmamış")
    name = request.session.get("user_name", "")
    
    # Kullanıcının ilk pet'inden profil resmini al
    user_pets = db.collection("Pets").where("email", "==", email).limit(1).get()
    user_pp = f"https://i.pravatar.cc/150?u={email}"  # Varsayılan profil resmi
    
    for doc in user_pets:
        pet_data = doc.to_dict()
        if pet_data.get("pp"):
            user_pp = pet_data["pp"]
        break
    
    # Tüm petleri çek
    pets_query = db.collection("Pets").get()
    pets = []
    
    for doc in pets_query:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        
        # Datetime nesnesini string'e çevir
        if "createdAt" in data:
            data["createdAt"] = data["createdAt"].isoformat()
            
        pets.append(data)
    
    return render(request, "home.html", {
        "email": email,
        "name": name,
        "user_pp": user_pp,
        "pets": pets
    })

# Kullanıcı Çıkış İşlemleri
def logout_user(request):
    request.session.flush()
    return redirect('/')

# Kullanıcı Bilgilerini Gösterme İşlemleri
def dashboard_view(request):
    email = request.session.get("user_email")
    if not email:
        return redirect("/login/")

    pets_query = db.collection("Pets").where("email", "==", email).get()
    pets = []

    for doc in pets_query:
        data = doc.to_dict()
        pets.append(data)

    return render(request, "dashboard.html", {
        "pets": pets
    })






# Kullanıcı Kayıt İşlemleri 
from django.shortcuts import render, redirect
from datetime import datetime
from firebase_init import db, upload_to_firebase_storage
import uuid
from django.contrib import messages


def register_user(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm-password')

        if not all([name, email, password, confirm_password]):
            return redirect('/register/')

        if password != confirm_password:
            return redirect('/register/')

        # 🔐 Benzersiz kullanıcı ID üret
        user_id = str(uuid.uuid4())

        user_data = {
            "id": user_id,
            "name": name,
            "email": email,
            "password": password,
            "createdAt": datetime.utcnow()
        }

        # 📥 Firestore'a kaydet
        db.collection("Users").document(user_id).set(user_data)

        # 🔥 SESSIONA KULLANICIYI YAZ
        request.session["user_email"] = email
        request.session["user_name"] = name


        return redirect('/pet-profile/')

    return redirect('/register/')


# Kullanıcı Giriş İşlemleri
def login_user(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        users = db.collection("Users").where("email", "==", email).get()

        for user in users:
            data = user.to_dict()
            if data["password"] == password:
                request.session["user_id"] = data["id"]
                request.session["user_email"] = data["email"]
                request.session["user_name"] = data.get("name", "")
                return redirect('/home/')

        
        messages.error(request, "E-posta veya şifre yanlış.")
        return redirect('/login/')  # eğer yanlışsa tekrar girişe yönlendir

    return redirect('/login/')

# Otomatik Giriş Sayfası
# Kullanıcı giriş yapmışsa otomatik yönlendirme
from django.shortcuts import redirect, render

def login_page(request):
    print("👀 Oturum durumu:", request.session.get("user_email"))
    if request.session.get("user_email"):
        return redirect('/home/')
    return render(request, 'login.html')



# Pet Ekleme İşlemleri
from django.shortcuts import redirect
from firebase_init import db
from datetime import datetime
import uuid

def add_pet(request):
    print("💡 Formdan istek geldi")
    print("Form verileri:", request.POST)

    if request.method == 'POST':
        # Formdan gelen verileri al
        pname = request.POST.get("petName")
        pet_type = request.POST.get("petType")
        breed = request.POST.get("petBreed")
        age = request.POST.get("petAge")
        gender = request.POST.get("petGender")
        photo_files = request.FILES.getlist("photos")
        image_url = ""
        gallery = []
        address = request.POST.get("petAddress")

        


        if photo_files:
            for idx, file in enumerate(photo_files):
                uploaded_url = upload_to_firebase_storage(file, file.name)
                image_id = str(uuid.uuid4())

                if idx == 0:
                    image_url = uploaded_url
                else:
                    gallery.append({
                        "id": image_id,
                        "url": uploaded_url
                    })

        #ekstra bilgiler
        sterilization = request.POST.get("sterilizationStatus")
        bio = request.POST.get("petDesc")
        interests_raw = request.POST.get("interests")

        # Kullanıcı bilgileri
        email = request.session.get("user_email", "")
        name = request.session.get("user_name", "")
        avatar_url = f"https://i.pravatar.cc/150?u={email}"  # otomatik görsel


        interests = []
        if interests_raw:
            try:
                import json
                interests = json.loads(interests_raw)
            except Exception:
                interests = []

        # Dosyaları sadece al, kaydetme
        vaccination_card = request.FILES.get('vaccination_card')
        vet_report = request.FILES.get('vet_report')

        print("Aşı Karnesi Var mı?:", bool(vaccination_card))
        print("Veteriner Raporu Var mı?:", bool(vet_report))

        pet_data = {
            "name": pname,
            "sex": gender,
            "age": str(age),
            "breed": breed,
            "category": pet_type,
            "imageUrl": image_url,
            "bio": bio,
            "address": address,
            "sterilization": sterilization,
            "interests": interests,
            "email": email,
            "uname": name,
            "pp": avatar_url,
            "createdAt": datetime.utcnow()
        }


        new_doc = db.collection("Pets").document()
        pet_id = new_doc.id
        pet_data["id"] = pet_id  # Bu pet'in id'sini veriye ekle
        new_doc.set(pet_data)

        return redirect('/dashboard/')

        
        print("Firestore'a gönderilecek veri:", pet_data)

    return redirect('/pet-profile/')

# Pet Görüntüleme İşlemleri
from django.shortcuts import render
from firebase_init import db

def my_pets_view(request):
    user_email = request.session.get("user_email")
    if not user_email:
        return redirect('/login/')

    pets = db.collection("Pets").where("email", "==", user_email).stream()

    pet_list = []
    for doc in pets:
        pet_data = doc.to_dict()
        pet_data["doc_id"] = doc.id  # ← İşte burada doc.id'yi pet objesine ekliyoruz
        pet_list.append(pet_data)

    return render(request, 'my_pets.html', {"pets": pet_list})


# Pet Silme İşlemleri
def delete_pet(request):
    if request.method == 'POST':
        pet_id = request.POST.get('pet_id')
        print("Silinecek PET ID:", pet_id)

        if not pet_id:
            messages.error(request, "Pet ID alınamadı.")
            return redirect('/my-pets/')

        try:
            # Önce pet'in var olduğunu ve kullanıcıya ait olduğunu kontrol et
            pet_ref = db.collection("Pets").document(pet_id)
            pet_doc = pet_ref.get()
            
            if not pet_doc.exists:
                messages.error(request, "Pet bulunamadı.")
                return redirect('/dashboard/')
            
            pet_data = pet_doc.to_dict()
            user_email = request.session.get("user_email")
            
            if pet_data.get("email") != user_email:
                messages.error(request, "Bu pet'i silme yetkiniz yok.")
                return redirect('/dashboard/')
            
            # Pet'i sil
            pet_ref.delete()
            messages.success(request, "Pet başarıyla silindi.")
            
        except Exception as e:
            print("Silme hatası:", str(e))
            messages.error(request, f"Silme işlemi sırasında bir hata oluştu: {str(e)}")
        
        return redirect('/dashboard/')
    
    return redirect('/dashboard/')

# Pet Güncelleme İşlemleri
def edit_pet_view(request, pet_id):
    doc_ref = db.collection("Pets").document(pet_id)
    doc = doc_ref.get()
    if not doc.exists:
        return redirect('/my-pets/')

    pet = doc.to_dict()
    pet["id"] = pet_id

    if request.method == 'POST':
        new_name = request.POST.get("name")
        new_age = request.POST.get("age")
        new_adr = request.POST.get("address")
        new_sex = request.POST.get("petGender")
        new_bio = request.POST.get("bio")
        new_photo = request.FILES.get("new_photo")

        update_data = {
            "name": new_name,
            "age": new_age,
            "address": new_adr,
            "sex": new_sex,
            "bio": new_bio,
        }

        if new_photo:
            new_url = upload_to_firebase_storage(new_photo, new_photo.name)
            update_data["imageUrl"] = new_url

        doc_ref.update(update_data)
        return redirect('/my-pets/')

    return render(request, "edit_pet.html", {"pet": pet})


# Kullanıcı Bilgilerini Güncelleme İşlemleri
from django.shortcuts import render, redirect
from firebase_init import db
from django.contrib import messages

def edit_profile_view(request):
    user_email = request.session.get("user_email")

    if not user_email:
        return redirect('/login/')

    if request.method == 'POST':
        new_uname = request.POST.get("uname")
        new_email = request.POST.get("email")
        new_pp = request.POST.get("pp")

        # Kullanıcının tüm pet kayıtlarını güncelle
        pets = db.collection("Pets").where("email", "==", user_email).stream()
        for pet in pets:
            pet.reference.update({
                "uname": new_uname,
                "email": new_email,
                "pp": new_pp
            })

        # Session güncelle
        request.session["user_email"] = new_email
        request.session["user_name"] = new_uname

        messages.success(request, "Profil bilgilerin başarıyla güncellendi.")
        return redirect('/dashboard/')

    # GET isteğinde mevcut bilgileri al
    pets = db.collection("Pets").where("email", "==", user_email).get()
    if pets:
        pet_data = pets[0].to_dict()
        return render(request, "edit_profile.html", {
            "uname": pet_data.get("uname", ""),
            "email": pet_data.get("email", ""),
            "pp": pet_data.get("pp", "")
        })

    return redirect('/dashboard/')
