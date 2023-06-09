# Generated by Django 3.2.18 on 2023-05-05 08:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expert', '0013_auto_20230503_1338'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='purposegroup',
            options={'verbose_name': 'Группу назначений объекта', 'verbose_name_plural': 'Группа назначений объектов'},
        ),
        migrations.AlterField(
            model_name='currentorder',
            name='square',
            field=models.DecimalField(decimal_places=4, max_digits=8, verbose_name='Площадь участка'),
        ),
        migrations.AlterField(
            model_name='fulfilledorder',
            name='square',
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True, verbose_name='Площадь участка'),
        ),
    ]
