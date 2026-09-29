from django.urls import path
from .views import health, version
urlpatterns = [path("health", health), path("version", version)]
