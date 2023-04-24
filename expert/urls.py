from django.urls import path
from expert.views import view_index, view_card, view_detail_order, OrderDetailView

app_name = 'expert'

urlpatterns = [
    path('', view_index, name='index'),
    path('card/', view_card, name='card'),
    path('detail/<int:pk>/', view_detail_order, name='order_detail'),
    path('api/v1/order/<int:pk>/', OrderDetailView.as_view())
]
