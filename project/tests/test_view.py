from django.test import TestCase, RequestFactory, Client
from django.urls import reverse
from expert.views import view_card, view_index, view_order, view_order_pages
from expert.models import (CurrentOrder, Region, Area, City, 
                           PurposeBuilding, PurposeGroup, WorkObjective)
from users.models import User

# class OrderViewTest(TestCase):
#     def setUp(self):
#         self.region = Region.objects.create(
#             name="Тест регион",
#             cadastral_region_number=24
#         )
#         self.area = Area.objects.create(
#             name="Тест площадь",
#             cadastral_area_number=39,
#             region=self.region
#         ) 
#         self.city = City.objects.create(
#             name="Тест город",
#             area=self.area
#         )
#         self.purpose_group = PurposeGroup.objects.create(
#             name="Тест название группы"
#         )
#         self.purpose_building = PurposeBuilding.objects.create(
#             purpose="Тест назначение",
#             group=self.purpose_group
#         )
#         self.work_objective = WorkObjective.objects.create(
#             objective="Тест градостроительная деятельность"
#         )

#         self.user = User.objects.create(
#             phone_number="+79223334455",
#             father_name="Тест отчество"
#         )
    #     self.factory = RequestFactory()
    #     self.order = CurrentOrder(
    #         title='Тест наименование объекта',
    #         name="Тест имя заказчика",
    #         surname="Тест фамилия заказчика",
    #         father_name="Тест отчество заказчика",
    #         phone_number="+79223334455",
    #         email="test_mail@gmail.com",
    #         cadastral_numbers="{24:39:0101001:369}",
    #         region=self.region,
    #         area=self.area,
    #         city=self.city,
    #         street="Тест улица",
    #         house_number=10,
    #         building=10,
    #         square=4,
    #         square_unit="sq_m",
    #         length=3,
    #         length_unit="m",
    #         width=4,
    #         width_unit="m",
    #         height=5,
    #         height_unit="m",
    #         comment="Тест комментарий",
    #         purpose_building=self.purpose_building,
    #         work_objective=self.work_objective,
    #         object_name="Тест название объекта",
    #         coordinates="[[[[55.331260724149544, 89.80055053361482], [55.33065063890653, 89.79999954295214], [55.33052996159193, 89.80046508586499], [55.331138372642194, 89.80101607652763]]]]",
    #         user=self.user,
    #     )
    
    # def test_order_detail_view(self):
    #     url = reverse("order", args=[self.order.pk])
    #     request = self.factory.get(url)
    #     response = view_order(request, self.order.pk)
    #     self.assertEqual(response.status_code, 200)
    #     # self.assertContains(response, self.user)


# class OrderPagesViewTest(TestCase):
#     def setUp(self):
#         self.order = Client()
        # self.region = Region.objects.create(
        #     name="Тест регион",
        #     cadastral_region_number=24
        # )
        # self.area = Area.objects.create(
        #     name="Тест площадь",
        #     cadastral_area_number=39,
        #     region=self.region
        # ) 
        # self.city = City.objects.create(
        #     name="Тест город",
        #     area=self.area
        # )
        # self.purpose_group = PurposeGroup.objects.create(
        #     name="Тест название группы"
        # )
        # self.purpose_building = PurposeBuilding.objects.create(
        #     purpose="Тест назначение",
        #     group=self.purpose_group
        # )
        # self.work_objective = WorkObjective.objects.create(
        #     objective="Тест градостроительная деятельность"
        # )

        # self.user = User.objects.create(
        #     phone_number="+79223334455",
        #     father_name="Тест отчество"
        # )
        # self.factory = RequestFactory()
        # self.order = CurrentOrder(
        #     title='Тест наименование объекта',
        #     name="Тест имя заказчика",
        #     surname="Тест фамилия заказчика",
        #     father_name="Тест отчество заказчика",
        #     phone_number="+79223334455",
        #     email="test_mail@gmail.com",
        #     cadastral_numbers="{24:39:0101001:369}",
        #     region=self.region,
        #     area=self.area,
        #     city=self.city,
        #     street="Тест улица",
        #     house_number=10,
        #     building=10,
        #     square=4,
        #     square_unit="sq_m",
        #     length=3,
        #     length_unit="m",
        #     width=4,
        #     width_unit="m",
        #     height=5,
        #     height_unit="m",
        #     comment="Тест комментарий",
        #     purpose_building=self.purpose_building,
        #     work_objective=self.work_objective,
        #     object_name="Тест название объекта",
        #     coordinates="[[[[55.331260724149544, 89.80055053361482], [55.33065063890653, 89.79999954295214], [55.33052996159193, 89.80046508586499], [55.331138372642194, 89.80101607652763]]]]",
        #     user=self.user
        # )

    # def test_view_order_pages_view(self):
    #     url = reverse("order_pages")
    #     response = self.client.get(url)
    #     self.assertEqual(response.status_code, 200)
    #     self.assertContains(response, 'Hello, world!')

