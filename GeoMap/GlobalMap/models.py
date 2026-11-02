from django.db import models
from django.contrib.auth.models import User


class ZoneStatus(models.TextChoices):
    AVAILABLE = '#10b981', 'Доступ к интернету без проблем (Зеленый)'
    LIMITED = '#f59e0b', 'Связь ограничена или нестабильна (Желтый)'
    UNAVAILABLE = '#ef4444', 'Полное отсутствие интернета (Красный)'


class CoverageZone(models.Model):

    geom = models.JSONField(verbose_name="Геометрия GeoJSON")
    status = models.CharField(
        max_length=20,
        choices=ZoneStatus.choices,
        default=ZoneStatus.AVAILABLE,
        verbose_name='Уровень сигнала'
    )
    zone_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name='Название района'
    )
    operators = models.JSONField(
        default=dict,
        verbose_name='Операторы и типы сетей'
    )
    comment = models.TextField(
        blank=True,
        null=True,
        verbose_name="Комментарий"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    def __str__(self):
        return f"Зона #{self.id} ({self.get_status_display()})"

    class Meta:
        verbose_name = 'Зона покрытия'
        verbose_name_plural = 'Зоны покрытия'


class UserMarker(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    author_name = models.CharField(max_length=150, default="Аноним")
    lat = models.FloatField()
    lng = models.FloatField()
    comment = models.TextField(max_length=500)
    icon_type = models.CharField(max_length=50, default="chat")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Marker by {self.author_name} at ({self.lat}, {self.lng})"