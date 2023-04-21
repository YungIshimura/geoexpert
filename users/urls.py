from django.urls import path
from users.views import view_profile, view_login

app_name = 'users'

urlpatterns = [
    path('login/', view_login, name='login'),
    path('profile/', view_profile, name='profile'),
]
