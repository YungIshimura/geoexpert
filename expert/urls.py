from django.urls import path
from expert.views import view_index, view_card

app_name = 'expert'

urlpatterns = [
    path('', view_index, name='index'),
    path('card/', view_card, name='card'),
]
