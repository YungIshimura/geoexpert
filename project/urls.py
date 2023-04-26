from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from project import settings


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('expert.urls', namespace='expert')),
    path('users/', include('users.urls', namespace='users')),
    path('__debug__/', include('debug_toolbar.urls')),
    path('chaining/', include('smart_selects.urls')),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
