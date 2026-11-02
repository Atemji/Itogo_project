from django.contrib import admin
from .models import ServiceItem, MobileProvider

@admin.register(ServiceItem)
class ServiceItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'icon')
    list_filter = ('category',)
    search_fields = ('name',)

@admin.register(MobileProvider)
class MobileProviderAdmin(admin.ModelAdmin):
    list_display = ('code',)
    filter_horizontal = ('allowed_services',)