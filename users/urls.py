from django.urls import path
from users.views import view_profile, view_login, view_logout, view_agreement
from django.conf import settings
from django.conf.urls.static import static

app_name = 'users'

urlpatterns = [
    path('login/', view_login, name='login'),
    path('profile/', view_profile, name='profile'),
    path('logout/', view_logout, name='logout'),
    path('agreement/', view_agreement, name='agreement')
] + static(settings.MEDIA_URL,document_root = settings.MEDIA_ROOT)
