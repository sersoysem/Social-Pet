from django.contrib import admin
from django.urls import path, include

# views import 
from .views import serve_web_index, cats, dogs, birds, fishes, hamsters, others, favorites, food, toggle_favorite, join_event, check_participation,nearby_vets, partner_vets, appointment, upcoming_events, create_events, past_events, adminpanel_view, edit_user_view, add_user_view, delete_user_view, delete_document_view, add_vet_view, petshop_panel_view, petshop_products_view, petshop_add_product, petshop_edit_product, petshop_delete_product, petshop_edit_product, chat_send_message, get_chat_messages, chat_combined_view, save_cart_to_firestore, get_cart_from_firestore, add_to_cart, remove_from_cart, update_cart_quantity, clear_cart, get_cart_count, save_appointment, delete_appointment, start_or_get_chat, save_like_dislike, get_user_matches

# api.views import
from api.views import register_user, register_page, add_pet, login_page, home_view, my_pets_view, dashboard_view, delete_pet, edit_pet_view, edit_profile_view
from socialpet_backend.views import serve_web_pet_profile, lost_pets, cart, toys, accessories, health # pet profile ve dashboard view'lerini ekle
from django.http import JsonResponse
import json
from django.conf import settings
from django.conf.urls.static import static
import os
from .views import edit_event, delete_event, test_view


urlpatterns = [
    path('test/', test_view),  # En yukarıya!
    path('chat/send/', chat_send_message, name='chat_send_message'),
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
    path('api/toggle-favorite/', toggle_favorite, name='toggle_favorite'),
   
    path('events/upcoming/', upcoming_events, name='upcoming_events'),
    path('events/create/', create_events, name='create_events'),
    path('events/past/', past_events, name='past_events'),

    path('events/<str:event_id>/edit/', edit_event, name='edit_event'),
    path('events/<str:event_id>/delete/', delete_event, name='delete_event'),
    path('events/<str:event_id>/join/', join_event, name='join_event'),

    path('events/<str:event_id>/check-participation/', check_participation, name='check_participation'),

    path('lost-pets/', lost_pets, name='lost_pets'),

    # CART/SEPET URL'LERİ
    path('cart/', cart, name='cart'),
    path('cart/get/', get_cart_from_firestore, name='get_cart'),
    path('cart/save/', save_cart_to_firestore, name='save_cart'),
    path('cart/add/', add_to_cart, name='add_to_cart'),
    path('cart/remove/', remove_from_cart, name='remove_from_cart'),
    path('cart/update/', update_cart_quantity, name='update_cart_quantity'),
    path('cart/clear/', clear_cart, name='clear_cart'),
    path('cart/count/', get_cart_count, name='get_cart_count'),
    
    path('food/', food, name='food'),
    path('toys/', toys, name='toys'),
    path('accessories/', accessories, name='accessories'),
    path('health/', health, name='health'),

    path('nearby_vets', nearby_vets, name='nearby_vets'),
    path('partner_vets', partner_vets, name='partner_vets'),
    path('vet_appointment', appointment, name='vet_appointment'),
    path('api/save_appointment/', save_appointment, name='save_appointment'),
    path('api/delete_appointment/', delete_appointment, name='delete_appointment'),

    path('chat/', chat_combined_view, name="chat_simple"),
    path('chat/messages/<str:chat_id>/', get_chat_messages, name='get_chat_messages'),
    path('chat/start/', start_or_get_chat, name='start_or_get_chat'),

    # --- ADMIN PANEL --- #
    path('adminpanel/', adminpanel_view, name='adminpanel'),
    path('adminpanel/edit_user/<str:email>/', edit_user_view, name='edit_user'),
    path('adminpanel/add_user/', add_user_view, name='add_user'),
    path('adminpanel/add_vet/', add_vet_view, name='add_vet'),
    path('adminpanel/delete_user/<str:email>/', delete_user_view, name='delete_user'),
    path('adminpanel/delete/<str:collection>/<str:doc_id>/', delete_document_view, name='delete_document'),

    # --- PETSHOP PANEL --- #
    path('petshop/', petshop_panel_view, name='petshop_panel'),
    path('petshop/products/', petshop_products_view, name='petshop_products'),
    path('petshop/products/add/', petshop_add_product, name='petshop_add_product'),
    path('petshop/products/edit/<str:doc_id>/', petshop_edit_product, name='petshop_edit_product'),
    path('petshop/products/delete/<str:doc_id>/', petshop_delete_product, name='petshop_delete_product'),
    path('petshop/products/edit/<str:doc_id>/', petshop_edit_product, name='petshop_edit_product'),

    # MATCH/EŞLEŞME URL'LERİ
    path('api/save-like-dislike/', save_like_dislike, name='save_like_dislike'),
    path('api/get-matches/', get_user_matches, name='get_user_matches'),

]


urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, "web"))

