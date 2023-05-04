import os

from django.db import models
from django.contrib.postgres.fields import ArrayField
import datetime
from django.contrib.auth import get_user_model
from smart_selects.db_fields import ChainedForeignKey
from django.core.validators import MinValueValidator, MaxValueValidator
from phonenumber_field.modelfields import PhoneNumberField

User = get_user_model()


def get_image_path(instance, filename):
    return f'order_images/{instance.order.id}/{filename}'

def get_screenshot_path(instance, filename):
    date = datetime.datetime.now().strftime('%Y%m%d')
    path = f'current_orders_screenshots/{date}-{instance.pk:03d}'
    filename = f'{date}-{instance.pk:03d}-map.png'
    return os.path.join(path, filename)


def get_map_path(instance, filename):
    return f'map/{instance.order.id}/{filename}'


class Region(models.Model):
    name = models.CharField(
        'Название региона',
        max_length=180
    )
    cadastral_region_number = models.CharField(
        'Кадастровый номер',
        max_length=2,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Регион'
        verbose_name_plural = 'Регионы'


class Area(models.Model):
    name = models.CharField(
        'Название района',
        max_length=200
    )
    cadastral_area_number = models.CharField(
        'Кадастровый номер',
        max_length=2,
        blank=True,
        null=True
    )
    region = models.ForeignKey(
        Region,
        related_name='areas',
        on_delete=models.CASCADE,
        verbose_name='Регион',
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Район'
        verbose_name_plural = 'Районы'


class City(models.Model):
    name = models.CharField(
        'Название города',
        max_length=100
    )
    area = models.ForeignKey(
        Area,
        related_name='citys',
        on_delete=models.CASCADE,
        verbose_name='Район',
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Город'
        verbose_name_plural = 'Города'


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

class PurposeGroup(models.Model):
    name = models.CharField('Название группы', max_length=150)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Группу назначений объекта'
        verbose_name_plural = 'Группа назначений объектов'


class PurposeBuilding(models.Model):
    purpose = models.CharField(
        'Назначение',
        max_length=150
    )

    group = models.ForeignKey(
        PurposeGroup,
        on_delete=models.CASCADE,
        verbose_name='Группа назначений',
        related_name='purpose_group',
        null=True,
        blank=True
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


class FulfilledOrder(models.Model):
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
        related_name='fulfilled_orders',
        verbose_name='Градостроительная деятельность'
    )
    type_work = models.ManyToManyField(
        TypeWork,
        related_name='fulfilled_orders',
        verbose_name='Виды изысканий',
    )
    research_purpose = models.ForeignKey(
        ResearchPurpose,
        on_delete=models.CASCADE,
        related_name='fulfilled_orders',
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
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Пользователь',
        blank=True,
        null=True
    )

    def __str__(self):
        return f'{self.name} {self.year}' if self.year else self.name

    class Meta:
        verbose_name = 'Выполненый заказ'
        verbose_name_plural = 'Выполненые заказы'


class FulfilledOrderImages(models.Model):
    order = models.ForeignKey(
        FulfilledOrder,
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


class CurrentOrder(models.Model):
    SQUARE_UNIT = (
        ('hectometer', 'га'),
        ('sq_m', 'м²'),
    )
    LENGTH_AND_WIDTH_UNIT = (
        ('m', 'м'),
        ('кь', 'км')
    )
    HEIGHT_UNIT = (
        ('m', 'м'),
        ('floor', 'этаж')
    )
    title = models.CharField(
        'Наименование объекта',
        max_length=300,
        blank=True,
        null=True
    )
    name = models.CharField(
        'Имя заказчика',
        max_length=100,
    )
    surname = models.CharField(
        'Фамилия заказчика',
        max_length=250,
    )
    father_name = models.CharField(
        'Отчество заказчика',
        max_length=250,
        blank=True,
        null=True
    )
    phone_number = PhoneNumberField(
        'Номер телефона'
    )
    email = models.EmailField(
        "Электронная почта заказчика",
        max_length=254,
        blank=True
    )
    cadastral_numbers = ArrayField(models.CharField(
        'Кадастровый номер',
        max_length=50,
    ), blank=True, null=True, verbose_name='Кадастровые номера', )
    region = models.ForeignKey(
        Region,
        related_name='orders',
        on_delete=models.CASCADE,
        verbose_name='Регион'
    )
    area = ChainedForeignKey(
        Area,
        chained_field='region',
        chained_model_field='region',
        show_all=False,
        auto_choose=True,
        sort=True
    )
    city = ChainedForeignKey(
        City,
        chained_field='area',
        chained_model_field='area',
        show_all=False,
        auto_choose=True,
        sort=True
    )
    street = models.CharField(
        'Улица',
        max_length=250,
    )
    house_number = models.PositiveIntegerField(
        'Номер дома',
        validators=[MinValueValidator(0)]
    )
    building = models.PositiveBigIntegerField(
        'Строение/Корпус',
        validators=[MinValueValidator(0)],
        blank=True,
        null=True,
    )
    square = models.DecimalField(
        'Площадь участка',
        max_digits=8,
        decimal_places=3
    )
    square_unit = models.CharField(
        'Еденица площади',
        max_length=10,
        choices=SQUARE_UNIT,
    )
    length = models.DecimalField(
        'Длина',
        max_digits=8,
        decimal_places=3,
    )
    length_unit = models.CharField(
        'Еденица длины',
        max_length=10,
        choices=LENGTH_AND_WIDTH_UNIT,
    )
    width = models.DecimalField(
        'Ширина',
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True
    )
    width_unit = models.CharField(
        'Еденица ширины',
        max_length=10,
        choices=LENGTH_AND_WIDTH_UNIT,
        null=True,
        blank=True
    )
    height = models.DecimalField(
        'Высота',
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True
    )
    height_unit = models.CharField(
        'Еденица высота',
        max_length=10,
        choices=HEIGHT_UNIT,
        null=True,
        blank=True
    )
    type_work = models.ManyToManyField(
        TypeWork,
        related_name='orders',
        verbose_name='Виды работ',
    )
    comment = models.TextField(
        'Комментарий',
        blank=True
    )
    date = models.DateTimeField(
        'Дата заявки',
        auto_now_add=True,
    )
    purpose_building = models.CharField(
        'Пользовательское назначение здания',
        max_length=200,
        blank=True,
        null=True
    )
    work_objective = models.ForeignKey(
        WorkObjective,
        on_delete=models.CASCADE,
        verbose_name='Цель работы',
        related_name='orders',
    )
    object_name = models.CharField(
        'Название объекта',
        max_length=200,
        blank=True,
        null=True
    )

    coordinates = models.CharField(
        'Координаты',
        max_length=1000,
        blank=True,
        null=True)

    map = models.ImageField(
        upload_to=get_screenshot_path,
        null=True,
        blank=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Пользователь',
        null=True,
        blank=True)

    def __str__(self):
        return f"Заказ #{self.date.strftime('%Y%m%d')}-{self.pk:03d}"

    class Meta:
        verbose_name = 'Невыполненный заказ'
        verbose_name_plural = 'Невыполненные заказы'


class CurrentOrderFile(models.Model):
    order = models.ForeignKey(
        CurrentOrder,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Заказы'
    )
    file = models.FileField(
        'Файл'
    )

    def __str__(self):
        return f'Файлы к заказу номер {self.order}'

    class Meta:
        verbose_name = 'Файлы к заказу'
        verbose_name_plural = 'Файлы к заказам'


# Ведомства необходимые для выгрузки DOCX
class Department(models.Model):
    region = models.ForeignKey(
        Region,
        related_name='region_department',
        on_delete=models.CASCADE,
        verbose_name='Регион ведомства',
    )
    name = models.CharField(
        'Название ведомства',
        max_length=250
    )
    director_position = models.CharField(
        'Должность руководителя ведомства',
        max_length=150
    )
    director_name = models.CharField(
        'Имя руководителя',
        max_length=20
    )
    director_surname = models.CharField(
        'Фамилия руководителя',
        max_length=50
    )
    director_patronymic = models.CharField(
        'Отчество руководителя',
        max_length=30
    )
    phone_number = PhoneNumberField(
        'Телефон ведомства'
    )
    email = models.EmailField(
        "Электронная почта ведомства",
        max_length=254
    )

    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = 'Ведомство'
        verbose_name_plural = 'Ведомства'
