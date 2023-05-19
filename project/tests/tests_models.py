from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile
from expert.models import (Area, City, Location, Region, TypeWork, Department,
                           WorkObjective, ResearchPurpose, PurposeGroup,
                           PurposeBuilding, WorkObjective, FulfilledOrder, CurrentOrder,
                           CurrentOrderFile, FulfilledOrderImages)
from users.models import User


class ModelsTestCase(TestCase):
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

        self.location = Location.objects.create(
            location="Тест локация"
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
        self.research_purpose = ResearchPurpose.objects.create(
            resarch="Тест цель изысканий"
        )
        self.user = User.objects.create(
            phone_number="+79223334455",
            father_name="Тест отчество"
        )
     

    def test_fulfilled_order(self): 
        self.fulfilled_order = FulfilledOrder.objects.create(
            name="Тест наименование объекта",
            address="Тест местоположение объекта",
            location=self.location,
            cadastral_numbers="{24:39:0101001:369}",
            coords="[[[[55.331260724149544, 89.80055053361482], [55.33065063890653, 89.79999954295214], [55.33052996159193, 89.80046508586499], [55.331138372642194, 89.80101607652763]]]]",
            purpose_building=self.purpose_building,
            is_liner=False,
            square=0.456,
            length=0.432,
            project_organisation="Тест проектная организация",
            general_contractor="Тест генподрядчик",
            customer="Тест заказчик",
            work_objective=self.work_objective,
            research_purpose=self.research_purpose,
            user=self.user,
        )
        self.fulfilled_order.type_work.add(self.typework, 
                                           self.typework_2)
        
        #Тест для добавления изображений для заявки
        image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\
            x00\x01\x08\x02\x00\x00\x00\x90\x86\x7f\x02\x00\x00\x00\x01sRGB\xae\xce\x1c\
                xe9\x00\x00\x00\x04gAMA\x00\x00\xb1\x8f\x0b\xfca\x05\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\
                x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xe5\x03\x1c\x14(\x10Kw\xe4\x00\x00\x00\
                    x19tEXtSoftware\x00www.inkscape.org\x00\x00\x00\x18IDATx\x9c\xed\xd2\xbd\t\x000\x0c\x04\xdf\
                        xff\xff[\x1b\xec\xae\x00\x00\x00\x00IEND\xaeB`\x82'
        uploaded_image = SimpleUploadedFile('test_image.png', image_data, content_type='image/png')

        my_model = FulfilledOrderImages.objects.create(
            order=self.fulfilled_order,
            image=uploaded_image
            )

        self.assertEqual(my_model.image.read(), image_data)
        
        
    def test_current_order(self):
        self.current_order = CurrentOrder.objects.create(
            title='Тест наименование объекта',
            name="Тест имя заказчика",
            surname="Тест фамилия заказчика",
            father_name="Тест отчество заказчика",
            phone_number="+79223334455",
            email="test_mail@gmail.com",
            cadastral_numbers="{24:39:0101001:369}",
            region=self.region,
            area=self.area,
            city=self.city,
            street="Тест улица",
            house_number=10,
            building=10,
            square=4,
            square_unit="sq_m",
            length=3,
            length_unit="m",
            width=4,
            width_unit="m",
            height=5,
            height_unit="m",
            comment="Тест комментарий",
            purpose_building=self.purpose_building,
            work_objective=self.work_objective,
            object_name="Тест название объекта",
            coordinates="[[[[55.331260724149544, 89.80055053361482], [55.33065063890653, 89.79999954295214], [55.33052996159193, 89.80046508586499], [55.331138372642194, 89.80101607652763]]]]",
            user=self.user,
            )
        self.current_order.type_work.add(self.typework, 
                                         self.typework_2)
        
        # Тест для добавления файла для заявки
        file_data = b'This is a test file'
        upload_file = SimpleUploadedFile('test_file.txt', file_data)
        file_model = CurrentOrderFile.objects.create(
            order=self.current_order,
            file=upload_file
        )
        self.assertEqual(file_model.file.read(), file_data)


    def test_department(self):
        self.department = Department.objects.create(
            region=self.region,
            name="Тест имя",
            director_position="Тест позиция",
            director_name="Тест имя",
            director_surname="Тест фамилия",
            director_patronymic="Тест должность",
            phone_number="+79223334455",
            email="test_mail@gmail.com"
        )


class UserLoginTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client.login(username='testuser', password='testpassword')


    def test_view_authentication(self):
        response = self.client.get('')
        self.assertEqual(response.status_code, 200)
        