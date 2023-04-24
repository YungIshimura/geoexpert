# Generated by Django 3.2.18 on 2023-04-19 09:02

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('expert', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResearchPurpose',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('resarch', models.CharField(max_length=50, verbose_name='Цель изысканий')),
            ],
            options={
                'verbose_name': 'Цель изысканий',
                'verbose_name_plural': 'Цели изысканий',
            },
        ),
        migrations.AlterModelOptions(
            name='typework',
            options={'verbose_name': 'Вид изыскания', 'verbose_name_plural': 'Виды изысканий'},
        ),
        migrations.AlterModelOptions(
            name='workobjective',
            options={'verbose_name': 'Градостроительная деятельность', 'verbose_name_plural': 'Градостроительные деятельности'},
        ),
        migrations.AlterField(
            model_name='order',
            name='type_work',
            field=models.ManyToManyField(related_name='orders', to='expert.TypeWork', verbose_name='Виды изысканий'),
        ),
        migrations.AlterField(
            model_name='order',
            name='work_objective',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='expert.workobjective', verbose_name='Градостроительная деятельность'),
        ),
        migrations.AlterField(
            model_name='order',
            name='year',
            field=models.IntegerField(choices=[(2009, 2009), (2010, 2010), (2011, 2011), (2012, 2012), (2013, 2013), (2014, 2014), (2015, 2015), (2016, 2016), (2017, 2017), (2018, 2018), (2019, 2019), (2020, 2020), (2021, 2021), (2022, 2022), (2023, 2023)], verbose_name='Год изысканий'),
        ),
        migrations.AlterField(
            model_name='typework',
            name='type',
            field=models.CharField(max_length=50, verbose_name='Вид изыскания'),
        ),
        migrations.AlterField(
            model_name='workobjective',
            name='objective',
            field=models.CharField(max_length=150, verbose_name='Градостроительная деятельность'),
        ),
        migrations.AddField(
            model_name='order',
            name='research_purpose',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='expert.researchpurpose', verbose_name='Цель изысканий'),
        ),
    ]