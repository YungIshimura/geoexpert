from django.urls import path
from expert.views import view_index

app_name = 'expert'

urlpatterns = [
    path('', view_index, name='index')
]
