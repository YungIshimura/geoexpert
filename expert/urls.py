from django.urls import path
from expert.views import (view_index, view_card, view_order, region_autocomplete,
                          area_autocomplete, city_autocomplete, ajax_validate_cadastral_number,
                          purpose_building_autocomplete, view_map_maker, OrderDetailView, view_order_pages,
                          view_change_order_status)

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
    path('map_maker', view_map_maker, name='map_maker'),
    path('api/v1/order/<int:pk>/', OrderDetailView.as_view()),
    path('order_pages/', view_order_pages, name='order_pages'),
    path('change_order_status/<int:order_id>/',
         view_change_order_status, name="change_order_status"),
]
