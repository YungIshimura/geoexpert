# Generated by Django 3.2.18 on 2023-04-19 09:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expert', '0005_auto_20230419_0922'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='is_liner',
            field=models.BooleanField(default=False, verbose_name='Объект линейный?'),
        ),
        migrations.AddField(
            model_name='order',
            name='length',
            field=models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True, verbose_name='Протяжённость участка'),
        ),
    ]