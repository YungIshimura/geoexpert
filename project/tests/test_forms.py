from django.test import TestCase
from expert.forms import OrderForm
from expert.models import (PurposeBuilding, PurposeGroup, 
                           WorkObjective, TypeWork,
                           Region, Area, City)
from users.forms import UserLoginForm, UserProfileForm

class FormTestCase(TestCase):
    def setUp(self):
        self.region = Region.objects.create(
            name="Тест регион",
            cadastral_region_number=24
        )

        self.area = Area.objects.create(
            name="Тест площадь",
            cadastral_area_number=39,
            region=self.region
        ) 
        self.city = City.objects.create(
            name="Тест город",
            area=self.area
        )
        self.purpose_group = PurposeGroup.objects.create(
            name="Тест название группы"
        )
        self.purpose_building = PurposeBuilding.objects.create(
            purpose="Тест назначение",
            group=self.purpose_group
        )
        self.work_objective = WorkObjective.objects.create(
            objective="Тест градостроительная деятельность"
        )
        self.typework = TypeWork.objects.create(
            type="Тест виды работ"
        )
        self.typework_2 = TypeWork.objects.create(
            type="Тест виды работ 2"
        )

    def test_valid_form(self):
        form_data = {
            "cadastral_numbers": "{24:39:0101001:369}",
            "region": self.region.pk,
            "area": self.area.pk,
            "city": self.city.pk,
            "street": "Суворова",
            "house_number": 5,
            "building": 4,
            "square": 4.434,
            "square_unit": "sq_m",
            "length": 4,
            "length_unit": "m",
            "width": 5,
            "width_unit": "m",
            "height": 5,
            "height_unit": "m",
            "type_work": [self.typework.pk],
            "comment": "Тест форм",
            "name": "Тест имя",
            "surname": "Тест фамилия",
            "father_name": "Тест отчество",
            "phone_number": "+79223334455",
            "email": "test_mail@gmail.com",
            "purpose_building": self.purpose_building.pk,
            "work_objective": self.work_objective.pk
        }
        form = OrderForm(data=form_data)
        self.assertTrue(form.is_valid())