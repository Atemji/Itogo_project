import json
import re
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import CoverageZone, UserMarker
from MobileProvider.models import MobileProvider, UserProfile


def map_view(request):
    return render(request, 'main/map.html')


@csrf_exempt
def save_zone(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({'status': 'error', 'message': 'Недостаточно прав'}, status=403)

        data = json.loads(request.body)
        zone_id = data.get('id')

        if zone_id:
            try:
                zone = CoverageZone.objects.get(id=zone_id)
                zone.geom = data.get('geom')
                zone.status = data.get('color')
                zone.operators = data.get('operators')
                zone.comment = data.get('comment')
                zone.save()
            except CoverageZone.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Зона не найдена'}, status=404)
        else:
            zone = CoverageZone.objects.create(
                geom=data.get('geom'),
                status=data.get('color'),
                operators=data.get('operators'),
                comment=data.get('comment')
            )
        return JsonResponse({'status': 'success', 'id': zone.id})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def get_zones(request):
    zones = CoverageZone.objects.all()
    result = []
    for z in zones:
        result.append({
            'id': z.id,
            'geom': z.geom,
            'color': z.status,
            'operators': z.operators,
            'comment': z.comment
        })
    return JsonResponse(result, safe=False)


@csrf_exempt
def delete_zone(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({'status': 'error', 'message': 'Недостаточно прав'}, status=403)

        data = json.loads(request.body)
        zone_id = data.get('id')
        if zone_id:
            CoverageZone.objects.filter(id=zone_id).delete()
            return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)

@csrf_exempt
def save_marker(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'status': 'error', 'message': 'Необходима авторизация'}, status=401)

        data = json.loads(request.body)
        marker = UserMarker.objects.create(
            user=request.user,
            lat=data.get('lat'),
            lng=data.get('lng'),
            comment=data.get('comment', ''),
            icon_type='chat'
        )
        display_name = request.user.first_name or request.user.username
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        avatar_url = profile.avatar.url if profile.avatar else ''

        return JsonResponse({
            'status': 'success',
            'id': marker.id,
            'lat': marker.lat,
            'lng': marker.lng,
            'comment': marker.comment,
            'icon_type': marker.icon_type,
            'author_name': display_name,
            'username': request.user.username,
            'avatar_url': avatar_url,
            'created_at': marker.created_at.strftime('%Y-%m-%d %H:%M')
        })
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def get_markers(request):
    markers = UserMarker.objects.all()
    result = []
    for m in markers:
        author = m.user.first_name or m.user.username if m.user else m.author_name
        avatar_url = ''
        if m.user:
            try:
                profile = m.user.profile
                if profile.avatar:
                    avatar_url = profile.avatar.url
            except UserProfile.DoesNotExist:
                pass

        result.append({
            'id': m.id,
            'lat': m.lat,
            'lng': m.lng,
            'comment': m.comment,
            'icon_type': m.icon_type,
            'author_name': author,
            'username': m.user.username if m.user else 'Аноним',
            'avatar_url': avatar_url,
            'created_at': m.created_at.strftime('%Y-%m-%d %H:%M')
        })
    return JsonResponse(result, safe=False)

@csrf_exempt
def delete_marker(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'status': 'error', 'message': 'Не авторизован'}, status=401)

        data = json.loads(request.body)
        marker_id = data.get('id')
        try:
            marker = UserMarker.objects.get(id=marker_id)
            if request.user.is_staff or request.user.is_superuser or marker.user == request.user:
                marker.delete()
                return JsonResponse({'status': 'success'})
            return JsonResponse({'status': 'error', 'message': 'Недостаточно прав'}, status=403)
        except UserMarker.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Маркер не найден'}, status=404)
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def register_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        password_confirm = data.get('password_confirm')

        if not username or not password:
            return JsonResponse({'status': 'error', 'message': 'Заполните обязательные поля'}, status=400)
        if re.search(r'[а-яА-ЯёЁ]', username):
            return JsonResponse({'status': 'error', 'message': 'Логин не должен содержать русские буквы'}, status=400)
        if password != password_confirm:
            return JsonResponse({'status': 'error', 'message': 'Пароли не совпадают'}, status=400)
        if len(password) < 6:
            return JsonResponse({'status': 'error', 'message': 'Пароль должен содержать не менее 6 символов'},
                                status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'status': 'error', 'message': 'Такой логин уже занят'}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user)
        login(request, user)
        return JsonResponse({'status': 'success', 'is_moderator': user.is_staff})
    return JsonResponse({'status': 'error'}, status=400)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = authenticate(request, username=data.get('username'), password=data.get('password'))
        if user is not None:
            login(request, user)
            return JsonResponse({'status': 'success', 'is_moderator': user.is_staff or user.is_superuser})
        return JsonResponse({'status': 'error', 'message': 'Неверный логин или пароль'}, status=400)
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({'status': 'success'})


def check_auth_view(request):
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        provider_code = profile.selected_provider.code if profile.selected_provider else ''
        return JsonResponse({
            'is_authenticated': True,
            'username': request.user.username,
            'email': request.user.email or '',
            'display_name': request.user.first_name or '',
            'selected_provider': provider_code,
            'is_moderator': request.user.is_staff or request.user.is_superuser,
            'avatar_url': profile.avatar.url if profile.avatar else ''
        })
    return JsonResponse({'is_authenticated': False})


@csrf_exempt
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Не авторизован'}, status=401)
    if request.method == 'POST':
        new_username = request.POST.get('username')
        new_email = request.POST.get('email')
        new_display_name = request.POST.get('display_name')
        provider_code = request.POST.get('selected_provider')
        avatar_file = request.FILES.get('avatar')

        if new_username and new_username != request.user.username:
            if re.search(r'[а-яА-ЯёЁ]', new_username):
                return JsonResponse({'status': 'error', 'message': 'Логин не должен содержать русские буквы'},
                                    status=400)
            if User.objects.filter(username=new_username).exists():
                return JsonResponse({'status': 'error', 'message': 'Такой логин уже занят'}, status=400)
            request.user.username = new_username

        if new_email is not None:
            request.user.email = new_email
        if new_display_name is not None:
            request.user.first_name = new_display_name

        request.user.save()

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if avatar_file:
            profile.avatar = avatar_file

        if provider_code:
            try:
                provider = MobileProvider.objects.get(code=provider_code)
                profile.selected_provider = provider
            except MobileProvider.DoesNotExist:
                profile.selected_provider = None
        else:
            profile.selected_provider = None
        profile.save()

        return JsonResponse({
            'status': 'success',
            'username': request.user.username,
            'email': request.user.email,
            'display_name': request.user.first_name,
            'selected_provider': provider_code,
            'avatar_url': profile.avatar.url if profile.avatar else ''
        })
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def password_reset_api(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {'status': 'success', 'message': 'Инструкции по сбросу пароля отправлены на указанный email.'})
        return JsonResponse({'status': 'error', 'message': 'Пользователь с такой электронной почтой не найден.'},
                            status=400)
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def change_password_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Не авторизован'}, status=401)

    if request.method == 'POST':
        data = json.loads(request.body)
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        new_password_confirm = data.get('new_password_confirm')

        if not old_password or not new_password or not new_password_confirm:
            return JsonResponse({'status': 'error', 'message': 'Заполните все поля'}, status=400)

        if not request.user.check_password(old_password):
            return JsonResponse({'status': 'error', 'message': 'Неверный текущий пароль'}, status=400)

        if new_password != new_password_confirm:
            return JsonResponse({'status': 'error', 'message': 'Новые пароли не совпадают'}, status=400)

        if len(new_password) < 6:
            return JsonResponse({'status': 'error', 'message': 'Пароль должен содержать не менее 6 символов'},
                                status=400)

        request.user.set_password(new_password)
        request.user.save()

        login(request, request.user)

        return JsonResponse({'status': 'success', 'message': 'Пароль успешно изменен'})

    return JsonResponse({'status': 'error'}, status=400)