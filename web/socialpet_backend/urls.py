from django.contrib import admin
from django.urls import path, include
from .views import serve_web_index, cats, dogs, birds, fishes, hamsters, others # login view'i de ekle
from api.views import register_user, register_page, add_pet, login_page, home_view, my_pets_view, dashboard_view, delete_pet, edit_pet_view, edit_profile_view
from socialpet_backend.views import serve_web_pet_profile  # pet profile ve dashboard view'lerini ekle
from django.http import JsonResponse
import json


from django.conf import settings
from django.conf.urls.static import static
import os


urlpatterns = [
    path('', serve_web_index),
    path('home/', home_view),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('login/', login_page),
    path('register/', register_page),  # GET için formu gösterir
    path('register/submit/', register_user),       # POST için form submit
    path('pet-profile/', serve_web_pet_profile),
    path('add-pet/', add_pet),
    path('dashboard/', dashboard_view),
    path('my-pets/', my_pets_view),
    path("delete-pet/", delete_pet),
    path('edit-pet/<str:pet_id>/', edit_pet_view, name='edit_pet'),
    path('edit-profile/', edit_profile_view, name='edit_profile'),
    
    
    path('cats/', cats, name='cats'),
    path('dogs/', dogs, name='dogs'),
    path('birds/', birds, name='birds'),
    path('fishes/', fishes, name='fishes'),
    path('hamsters/', hamsters, name='hamsters'),
    path('others/', others, name='others'),







]


urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, "web"))

