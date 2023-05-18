# from django.test import TestCase, RequestFactory
# from django.urls import reverse
# from expert.views import view_card, view_index, view_order, view_order_pages
# from expert.models import CurrentOrder

# class OrderViewTest(TestCase):
#     def setUp(self):
#         self.factory = RequestFactory()
#         self.order = CurrentOrder(

#         )
    
#     def test_order_detail_view(self):
#         url = reverse("order_detail", args=[self.order.pk])
#         request = self.factory.get(url)
#         response = view_order(request, self.order.pk)
#         self.assertEqual(response.status_code, 200)
#         self.assertContains(response, self.author.name)