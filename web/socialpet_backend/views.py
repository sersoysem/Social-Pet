import os
from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render, redirect

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
