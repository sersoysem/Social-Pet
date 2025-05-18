from django.contrib import admin
from django.urls import path, include
from .views import serve_web_index, cats, dogs, birds, fishes, hamsters, others, favorites, toggle_favorite # login view'i de ekle
from api.views import register_user, register_page, add_pet, login_page, home_view, my_pets_view, dashboard_view, delete_pet, edit_pet_view, edit_profile_view
from socialpet_backend.views import serve_web_pet_profile  # pet profile ve dashboard view'lerini ekle
from django.http import JsonResponse
import json
from .views import upcoming_events, create_events, past_events


from django.conf import settings
from django.conf.urls.static import static
import os
from . import views
from .views import edit_event, delete_event


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
    path('favorites/', favorites, name='favorites'),
    path('api/toggle-favorite/', views.toggle_favorite, name='toggle_favorite'),
   
   
    path('events/upcoming/', upcoming_events, name='upcoming_events'),
    path('events/create/', create_events, name='create_events'),
    path('events/past/', past_events, name='past_events'),

    path('events/<str:event_id>/edit/', views.edit_event, name='edit_event'),
    path('events/<str:event_id>/delete/', views.delete_event, name='delete_event'),
    path('events/<str:event_id>/join/', views.join_event, name='join_event'),

    path('events/<str:event_id>/check-participation/', views.check_participation, name='check_participation'),








]


urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, "web"))

