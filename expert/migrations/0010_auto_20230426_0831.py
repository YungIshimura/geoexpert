# Generated by Django 3.2.18 on 2023-04-26 08:31

from django.conf import settings
import django.contrib.postgres.fields
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import expert.models
import phonenumber_field.modelfields
import smart_selects.db_fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('expert', '0009_auto_20230424_1152'),
    ]

    operations = [
        migrations.CreateModel(
            name='Area',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Название района')),
                ('cadastral_area_number', models.CharField(blank=True, max_length=2, null=True, verbose_name='Кадастровый номер')),
            ],
            options={
                'verbose_name': 'Район',
                'verbose_name_plural': 'Районы',
            },
        ),
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Название города')),
                ('area', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='citys', to='expert.area', verbose_name='Район')),
            ],
            options={
                'verbose_name': 'Город',
                'verbose_name_plural': 'Города',
            },
        ),
        migrations.CreateModel(
            name='CurrentOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=300, null=True, verbose_name='Наименование объекта')),
                ('name', models.CharField(max_length=100, verbose_name='Имя заказчика')),
                ('surname', models.CharField(max_length=250, verbose_name='Фамилия заказчика')),
                ('father_name', models.CharField(blank=True, max_length=250, null=True, verbose_name='Отчество заказчика')),
                ('phone_number', phonenumber_field.modelfields.PhoneNumberField(max_length=128, region=None, verbose_name='Номер телефона')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='Электронная почта заказчика')),
                ('cadastral_numbers', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=50, verbose_name='Кадастровый номер'), blank=True, null=True, size=None, verbose_name='Кадастровые номера')),
                ('street', models.CharField(max_length=250, verbose_name='Улица')),
                ('house_number', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(0)], verbose_name='Номер дома')),
                ('building', models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Строение/Корпус')),
                ('square', models.DecimalField(decimal_places=3, max_digits=8, verbose_name='Площадь участка')),
                ('square_unit', models.CharField(choices=[('hectometer', 'га'), ('sq_m', 'м²')], max_length=10, verbose_name='Еденица площади')),
                ('length', models.DecimalField(decimal_places=3, max_digits=8, verbose_name='Длина')),
                ('length_unit', models.CharField(choices=[('m', 'м'), ('кь', 'км')], max_length=10, verbose_name='Еденица длины')),
                ('width', models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True, verbose_name='Ширина')),
                ('width_unit', models.CharField(blank=True, choices=[('m', 'м'), ('кь', 'км')], max_length=10, null=True, verbose_name='Еденица ширины')),
                ('height', models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True, verbose_name='Высота')),
                ('height_unit', models.CharField(blank=True, choices=[('m', 'м'), ('floor', 'этаж')], max_length=10, null=True, verbose_name='Еденица высота')),
                ('comment', models.TextField(blank=True, verbose_name='Комментарий')),
                ('date', models.DateTimeField(auto_now_add=True, verbose_name='Дата заявки')),
                ('purpose_building', models.CharField(blank=True, max_length=200, null=True, verbose_name='Пользовательское назначение здания')),
                ('object_name', models.CharField(blank=True, max_length=200, null=True, verbose_name='Название объекта')),
                ('coordinates', models.CharField(blank=True, max_length=1000, null=True, verbose_name='Координаты')),
                ('map', models.ImageField(blank=True, null=True, upload_to=expert.models.get_map_path)),
                ('area', smart_selects.db_fields.ChainedForeignKey(auto_choose=True, chained_field='region', chained_model_field='region', on_delete=django.db.models.deletion.CASCADE, to='expert.area')),
                ('city', smart_selects.db_fields.ChainedForeignKey(auto_choose=True, chained_field='area', chained_model_field='area', on_delete=django.db.models.deletion.CASCADE, to='expert.city')),
            ],
            options={
                'verbose_name': 'Заказ',
                'verbose_name_plural': 'Заказы',
            },
        ),
        migrations.CreateModel(
            name='FulfilledOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=300, verbose_name='Наименование объекта')),
                ('address', models.CharField(max_length=500, verbose_name='Местоположение объекта')),
                ('cadastral_numbers', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=50, verbose_name='Кадастровый номер'), blank=True, null=True, size=None, verbose_name='Кадастровые номера')),
                ('coords', models.CharField(max_length=1000, verbose_name='Координаты')),
                ('is_liner', models.BooleanField(default=False, verbose_name='Объект линейный?')),
                ('square', models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True, verbose_name='Площадь участка')),
                ('length', models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True, verbose_name='Протяжённость участка')),
                ('project_organisation', models.CharField(blank=True, max_length=200, null=True, verbose_name='Проектная организация')),
                ('general_contractor', models.CharField(blank=True, max_length=200, null=True, verbose_name='Генподрядчик')),
                ('customer', models.CharField(max_length=200, verbose_name='Заказчик')),
                ('year', models.IntegerField(blank=True, choices=[(2009, 2009), (2010, 2010), (2011, 2011), (2012, 2012), (2013, 2013), (2014, 2014), (2015, 2015), (2016, 2016), (2017, 2017), (2018, 2018), (2019, 2019), (2020, 2020), (2021, 2021), (2022, 2022), (2023, 2023)], null=True, verbose_name='Год изысканий')),
                ('location', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='orders', to='expert.location', verbose_name='Локация')),
                ('purpose_building', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='expert.purposebuilding', verbose_name='Назначение объекта')),
                ('research_purpose', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='fulfilled_orders', to='expert.researchpurpose', verbose_name='Цель изысканий')),
                ('type_work', models.ManyToManyField(related_name='fulfilled_orders', to='expert.TypeWork', verbose_name='Виды изысканий')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
                ('work_objective', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fulfilled_orders', to='expert.workobjective', verbose_name='Градостроительная деятельность')),
            ],
            options={
                'verbose_name': 'Выполненый заказ',
                'verbose_name_plural': 'Невыполненый заказ',
            },
        ),
        migrations.CreateModel(
            name='FulfilledOrderImages',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(blank=True, null=True, upload_to=expert.models.get_image_path)),
                ('order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='images', to='expert.fulfilledorder', verbose_name='Заказ')),
            ],
            options={
                'verbose_name': 'файл с фотографией к заказу',
                'verbose_name_plural': 'Фото к заказам',
            },
        ),
        migrations.CreateModel(
            name='OrderFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='', verbose_name='Файл')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='files', to='expert.currentorder', verbose_name='Заказы')),
            ],
            options={
                'verbose_name': 'Файлы к заказу',
                'verbose_name_plural': 'Файлы к заказам',
            },
        ),
        migrations.CreateModel(
            name='Region',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=180, verbose_name='Название региона')),
                ('cadastral_region_number', models.CharField(blank=True, max_length=2, null=True, verbose_name='Кадастровый номер')),
            ],
            options={
                'verbose_name': 'Регион',
                'verbose_name_plural': 'Регионы',
            },
        ),
        migrations.RemoveField(
            model_name='orderimages',
            name='order',
        ),
        migrations.DeleteModel(
            name='Order',
        ),
        migrations.DeleteModel(
            name='OrderImages',
        ),
        migrations.AddField(
            model_name='currentorder',
            name='region',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='expert.region', verbose_name='Регион'),
        ),
        migrations.AddField(
            model_name='currentorder',
            name='type_work',
            field=models.ManyToManyField(related_name='orders', to='expert.TypeWork', verbose_name='Виды работ'),
        ),
        migrations.AddField(
            model_name='currentorder',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Пользователь'),
        ),
        migrations.AddField(
            model_name='currentorder',
            name='work_objective',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='expert.workobjective', verbose_name='Цель работы'),
        ),
        migrations.AddField(
            model_name='area',
            name='region',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='areas', to='expert.region', verbose_name='Регион'),
        ),
    ]
