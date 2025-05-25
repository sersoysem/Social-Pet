from django.db import models
from django.contrib.auth.models import User

class Pet(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    breed = models.CharField(max_length=100, blank=True)
    age = models.PositiveIntegerField()
    image_url = models.URLField()
    favorited_by = models.ManyToManyField(User, related_name='favorites', blank=True)

    def __str__(self):
        return self.name
    
    # models.py

class Vet(models.Model):
    name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=50)
    latitude = models.FloatField()  # Enlem
    longitude = models.FloatField() # Boylam
    phone = models.CharField(max_length=20, blank=True)
    hours = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to="vets", blank=True, null=True)

    def __str__(self):
        return self.name
