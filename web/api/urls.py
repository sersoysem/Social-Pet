from django.urls import path
from .views import register_user, login_user, logout_user, login_page
from django.views.decorators.csrf import csrf_exempt
from .views import register_page, register_user, login_user, logout_user, edit_pet_view
from django.shortcuts import render

urlpatterns = [
    path('register/', register_page),        # GET: formu gösterir
    path('register/submit/', register_user), # POST: form submit
    path('login/', login_page),
    path('login/submit/', login_user),
    path('logout/', logout_user),
    path('edit-pet/<str:pet_id>/', edit_pet_view, name='edit_pet'),
]
