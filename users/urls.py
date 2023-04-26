from django.urls import path
from users.views import view_profile, view_login, view_logout, view_agreement

app_name = 'users'

urlpatterns = [
    path('login/', view_login, name='login'),
    path('profile/', view_profile, name='profile'),
    path('logout/', view_logout, name='logout'),
    path('agreement/', view_agreement, name='agreement')
]
