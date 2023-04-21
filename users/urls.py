from django.urls import path
from users.views import view_profile, view_login, view_logout

app_name = 'users'

urlpatterns = [
    path('login/', view_login, name='login'),
    path('profile/', view_profile, name='profile'),
    path('logout/', view_logout, name='logout')
]
