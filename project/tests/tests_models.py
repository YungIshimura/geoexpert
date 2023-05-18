from django.test import TestCase
from expert.models import (Area, City, Location, Region, TypeWork, Department,
                           WorkObjective, ResearchPurpose, PurposeGroup,
                           PurposeBuilding, WorkObjective, FulfilledOrder,
                           FulfilledOrderImages, CurrentOrder, CurrentOrderFile)
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
            coords="",
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
            coordinates="",
            user=self.user,
            )
        self.current_order.type_work.add(self.typework, 
                                         self.typework_2)


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


    
