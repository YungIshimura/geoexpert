from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from expert.forms import OrderForm
from expert.models import (PurposeBuilding, PurposeGroup, 
                           WorkObjective, TypeWork,
                           Region, Area, City)
from users.forms import UserProfileForm, AvatarUserForm


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


    def test_valid_order_form(self):
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
    
    
    def test_valid_user_form(self):
        image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\
            x00\x01\x08\x02\x00\x00\x00\x90\x86\x7f\x02\x00\x00\x00\x01sRGB\xae\xce\x1c\
                xe9\x00\x00\x00\x04gAMA\x00\x00\xb1\x8f\x0b\xfca\x05\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\
                x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xe5\x03\x1c\x14(\x10Kw\xe4\x00\x00\x00\
                    x19tEXtSoftware\x00www.inkscape.org\x00\x00\x00\x18IDATx\x9c\xed\xd2\xbd\t\x000\x0c\x04\xdf\
                        xff\xff[\x1b\xec\xae\x00\x00\x00\x00IEND\xaeB`\x82'
        uploaded_image = SimpleUploadedFile('test_image.png', image_data, content_type='image/png')

        form_data_user = {
            "username": "test_username",
            "phone_number": "+79223334455",
            "email": "test_mail@gmail.com",
            "first_name": "Тест имя",
            "last_name": "Тест фамилия",
            "father_name": "Тест отчество",
            "image": uploaded_image
        }
        form = UserProfileForm(data=form_data_user)
        self.assertTrue(form.is_valid())
        form_image = AvatarUserForm(data=form_data_user)
        self.assertTrue(form_image.is_valid())
