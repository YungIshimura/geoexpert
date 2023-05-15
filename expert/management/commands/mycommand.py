import json
from expert.models import Region, Area
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Описание команды'

    def handle(self, *args, **options):
        with open('static/districts_dict.json', 'r', encoding='utf-8') as f:
            districts = json.load(f)

        with open('static/regions_dict.json', 'r', encoding='utf-8') as f:
            regions = json.load(f)

        for region_number, region_name in regions.items():
            Region.objects.bulk_create([
                Region(name=region_name, 
                       cadastral_region_number=region_number)
            ])

        for districts_number, districts_name in districts.items():
            first_pair, second_pair = districts_number.split(':')
            all_regions = Region.objects.all().filter(cadastral_region_number=first_pair)
            for region in all_regions:
                Area.objects.bulk_create([
                Area(name=districts_name, 
                cadastral_area_number=second_pair,
                region=region)
            ])


            





        
