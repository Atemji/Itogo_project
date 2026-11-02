from django.shortcuts import render
from django.http import JsonResponse
from MobileProvider.models import MobileProvider

def get_providers_api(request):
    providers = MobileProvider.objects.prefetch_related('allowed_services').all()
    data = []
    for p in providers:
        services = [{
            'id': s.id,
            'name': s.name,
            'category': s.category,
            'category_name': s.get_category_display(),
            'icon_url': s.icon.url if s.icon else ''
        } for s in p.allowed_services.all()]
        data.append({
            'code': p.code,
            'name': p.get_code_display(),
            'services': services
        })
    return JsonResponse(data, safe=False)