# Generated by Django 3.2.18 on 2023-04-22 07:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expert', '0007_orderimages'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='coords',
            field=models.CharField(max_length=1000, verbose_name='Координаты'),
        ),
    ]
