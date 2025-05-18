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
