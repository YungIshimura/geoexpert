from django.urls import path
from expert.views import (view_index, view_card, view_order, region_autocomplete,
                          area_autocomplete, city_autocomplete, ajax_validate_cadastral_number,
                          purpose_building_autocomplete, view_map_maker, ajax_get_coords, OrderDetailView,
                          view_order_pages, view_change_order_status, download_map, download_xlsx, download_igi_docx,
                          download_igdi_docx, download_all_docx)

app_name = 'expert'

urlpatterns = [
    path('', view_index, name='index'),
    path('card/', view_card, name='card'),
    path('region_autocomlete', region_autocomplete, name='region_autocomplete'),
    path('area_autocomlete', area_autocomplete, name='area_autocomplete'),
    path('city_autocomplete', city_autocomplete, name='city_autocomplete'),
    path('validate_cadastral', ajax_validate_cadastral_number,
         name='ajax_validate_cadastral_number'),
    path('order/', view_order, name='order'),
    path('purpose_building_autocomplete/', purpose_building_autocomplete,
         name='purpose_building_autocomplete'),
    path('map_maker/', view_map_maker, name='map_maker'),
    path('get_coords/', ajax_get_coords, name='get_coords'),
    path('api/v1/order/<int:pk>/', OrderDetailView.as_view()),
    path('order_pages/', view_order_pages, name='order_pages'),
    path('change_order_status/<int:order_id>/',
         view_change_order_status, name="change_order_status"),
    path('download_igi_docx/<int:pk>/',
         download_igi_docx, name='download_igi_docx'),
    path('download_igdi_docx/<int:pk>/',
         download_igdi_docx, name='download_igdi_docx'),
    path('download_all_docx/<int:pk>/',
         download_all_docx, name='download_all_docx'),
    path('download_map/<int:pk>/', download_map, name='download_map'),
    path('download_xlsx/<int:pk>/', download_xlsx, name='download_xlsx')
]
