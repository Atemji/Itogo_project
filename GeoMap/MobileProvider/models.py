from django.db import models
from django.contrib.auth.models import User

class ServiceCategory(models.TextChoices):
    MARKETPLACES = 'marketplaces', 'Магазины и маркетплейсы'
    BANKS = 'banks', 'Банки и финансы'
    GOV = 'gov', 'Госсервисы'
    SOCIAL = 'social', 'Соцсети и мессенджеры'

class ServiceItem(models.Model):
    name = models.CharField(max_length=100, verbose_name='Название сервиса')
    category = models.CharField(
        max_length=30,
        choices=ServiceCategory.choices,
        default=ServiceCategory.MARKETPLACES,
        verbose_name='Категория'
    )
    icon = models.ImageField(upload_to='service_icons/', blank=True, null=True, verbose_name="Логотип (PNG)")

    def __str__(self):
        return f"[{self.get_category_display()}] {self.name}"

    class Meta:
        verbose_name = "Сервис"
        verbose_name_plural = "Сервисы"


class MobileProvider(models.Model):
    class CodeChoices(models.TextChoices):
        MTS = "mts", "МТС"
        BEELINE = "Beeline", "Билайн"
        MEGAFON = "megafon", "Мегафон"
        TELE2 = "tele2", "теле2"
        YOTA = "yota", "йота"

    code = models.CharField(
        max_length=20,
        choices=CodeChoices.choices,
        unique=True,
        verbose_name="Оператор"
    )
    allowed_services = models.ManyToManyField(
        ServiceItem,
        blank=True,
        verbose_name="Доступные сервисы по умолчанию"
    )

    def __str__(self):
        return self.get_code_display()

    class Meta:
        verbose_name = "Настройка оператора"
        verbose_name_plural = "Настройки операторов"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    selected_provider = models.ForeignKey(
        MobileProvider,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Мобильный оператор'
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар')

    def __str__(self):
        return f"Профиль {self.user.username}"