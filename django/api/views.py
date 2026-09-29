from django.http import JsonResponse
from django.views.decorators.http import require_GET
@require_GET
def health(request):
    return JsonResponse({"status": "ok", "service": "onsen-api", "backend": "django"})
@require_GET
def version(request):
    return JsonResponse({"service": "onsen-api", "api": "v1", "contract": "openapi-first"})
