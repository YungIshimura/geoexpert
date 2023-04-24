from django.db import models
from django.contrib.postgres.fields import ArrayField
import datetime


def get_image_path(instance, filename):
    return f'order_images/{instance.order.id}/{filename}'


class Location(models.Model):
    location = models.CharField(
        'Локация',
        max_length=200
    )

    def __str__(self):
        return self.location

    class Meta:
        verbose_name = 'Локация'
        verbose_name_plural = 'Локации'


class TypeWork(models.Model):
    type = models.CharField(
        'Вид изыскания',
        max_length=50
    )

    def __str__(self):
        return self.type

    class Meta:
        verbose_name = 'Вид изыскания'
        verbose_name_plural = 'Виды изысканий'


class ResearchPurpose(models.Model):
    resarch = models.CharField(
        'Цель изысканий',
        max_length=50
    )

    def __str__(self):
        return self.resarch

    class Meta:
        verbose_name = 'Цель изысканий'
        verbose_name_plural = 'Цели изысканий'


class PurposeBuilding(models.Model):
    purpose = models.CharField(
        'Назначение',
        max_length=150
    )

    def __str__(self):
        return self.purpose

    class Meta:
        verbose_name = 'Назначение объекта'
        verbose_name_plural = 'Назначения объектов'


class WorkObjective(models.Model):
    objective = models.CharField(
        'Градостроительная деятельность',
        max_length=150
    )

    def __str__(self):
        return self.objective

    class Meta:
        verbose_name = 'Градостроительная деятельность'
        verbose_name_plural = 'Градостроительные деятельности'


def year_choices():
    return [(r, r) for r in range(2009, datetime.date.today().year + 1)]


class Order(models.Model):
    STATUS = (
        ('completed', 'Выполнен'),
        ('not completed', 'Не выполнен'),
    )
    name = models.CharField(
        'Наименование объекта',
        max_length=300
    )
    address = models.CharField(
        'Местоположение объекта',
        max_length=500
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name='Локация',
        blank=True,
        null=True
    )
    cadastral_numbers = ArrayField(models.CharField(
        'Кадастровый номер',
        max_length=50,
    ), blank=True, null=True, verbose_name='Кадастровые номера', )
    coords = models.CharField(
        'Координаты',
        max_length=1000
    )
    purpose_building = models.ForeignKey(
        PurposeBuilding,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Назначение объекта',
        blank=True,
        null=True
    )
    is_liner = models.BooleanField(
        'Объект линейный?',
        default=False
    )
    square = models.DecimalField(
        'Площадь участка',
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True
    )
    length = models.DecimalField(
        'Протяжённость участка',
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True
    )
    project_organisation = models.CharField(
        'Проектная организация',
        max_length=200,
        blank=True,
        null=True
    )
    general_contractor = models.CharField(
        'Генподрядчик',
        max_length=200,
        blank=True,
        null=True
    )
    customer = models.CharField(
        'Заказчик',
        max_length=200
    )
    work_objective = models.ForeignKey(
        WorkObjective,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Градостроительная деятельность'
    )
    type_work = models.ManyToManyField(
        TypeWork,
        related_name='orders',
        verbose_name='Виды изысканий',
    )
    research_purpose = models.ForeignKey(
        ResearchPurpose,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Цель изысканий',
        blank=True,
        null=True
    )
    year = models.IntegerField(
        'Год изысканий',
        choices=year_choices(),
        blank=True,
        null=True
    )
    status = models.CharField(
        'Статус заказа',
        max_length=20,
        choices=STATUS,
        default='completed'
    )

    def __str__(self):
        return f'{self.name} {self.year}' if self.year else self.name

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'


class OrderImages(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Заказ',
        blank=True,
        null=True
    )
    image = models.ImageField(
        upload_to=get_image_path,
        blank=True,
        null=True
    )

    def __str__(self):
        return f'Фото к заказу номер {self.order.id}'


    class Meta:
        verbose_name = 'файл с фотографией к заказу'
        verbose_name_plural = 'Фото к заказам'

