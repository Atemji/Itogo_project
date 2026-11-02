from django.urls import path

from .views import (
    map_view, save_zone, get_zones, delete_zone,
    save_marker, get_markers, delete_marker,
    register_view, login_view, logout_view, check_auth_view,
    update_profile, password_reset_api, change_password_api
)
from MobileProvider.views import get_providers_api

urlpatterns = [
    path('', map_view, name='home'),
    path('api/save-zone/', save_zone, name='save_zone'),
    path('api/get-zones/', get_zones, name='get_zones'),
    path('api/get-providers/', get_providers_api, name='get_providers'),
    path('api/delete-zone/', delete_zone, name='delete_zone'),
    path('api/save-marker/', save_marker, name='save_marker'),
    path('api/get-markers/', get_markers, name='get_markers'),
    path('api/delete-marker/', delete_marker, name='delete_marker'),
    path('api/register/', register_view, name='register'),
    path('api/login/', login_view, name='login'),
    path('api/logout/', logout_view, name='logout'),
    path('api/check-auth/', check_auth_view, name='check_auth'),
    path('api/update-profile/', update_profile, name='update_profile'),
    path('api/password-reset/', password_reset_api, name='password_reset'),
    path('api/change-password/', change_password_api, name='change_password'),
]