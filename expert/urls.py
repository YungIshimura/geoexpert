from django.urls import path
from expert.views import view_index, view_card, OrderDetailView

app_name = 'expert'

urlpatterns = [
    path('', view_index, name='index'),
    path('card/', view_card, name='card'),
    path('api/v1/order/<int:pk>/', OrderDetailView.as_view())
]
