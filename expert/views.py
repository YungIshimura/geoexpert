from django.shortcuts import render, HttpResponseRedirect
from .models import CurrentOrder, FulfilledOrder, FulfilledOrderImages, Region, Area, City, CurrentOrderFile, \
    PurposeBuilding
from django.http import HttpRequest, HttpResponse, JsonResponse
from rest_framework import generics
from .serializers import OrderSelializer
from .permissions import IsOwnerOrReadOnly
from .validators import validate_number
from django.core.exceptions import ValidationError
from django.urls import reverse
from pypdf import PdfReader
from io import StringIO
import os
from django.contrib import messages
from django.db import transaction
from .forms import OrderFileForm, OrderForm


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSelializer
    queryset = FulfilledOrder.objects.all()
    permission_classes = (IsOwnerOrReadOnly,)


def region_autocomplete(request: HttpRequest) -> JsonResponse:
    if 'term' in request.GET:
        filtered_regions = Region.objects.filter(
            name__icontains=request.GET.get('term')
        )
        regions = []
        for region in filtered_regions:
            regions.append(region.name)

        return JsonResponse(regions, safe=False)


def area_autocomplete(request: HttpRequest) -> JsonResponse:
    region = Region.objects.get(
        name__icontains=request.GET.get('region')
    )
    areas = []
    for area in region.areas.all():
        areas.append(f'{region.name}, {area.name}')

    return JsonResponse(areas, safe=False)


def city_autocomplete(request: HttpRequest) -> JsonResponse:
    data = request.GET.get('region').split(', ')
    data.remove('')
    region, area = data
    areas = Area.objects.get(name=area)
    citys = []
    for city in areas.citys.all():
        citys.append(f'{region}, {area}, {city.name}')

    return JsonResponse(citys, safe=False)


def ajax_validate_cadastral_number(request: HttpRequest) -> JsonResponse:
    cadastral_number = request.GET.get('cadastral_number', None)

    try:
        validate_number(cadastral_number)
        response = {
            'is_valid': True
        }
    except ValidationError:
        response = {
            'is_valid': False
        }

    return JsonResponse(response)


def purpose_building_autocomplete(request):
    purpose_buildings = PurposeBuilding.objects.all().values_list(
        'purpose', flat=True
    )
    purpose_building_options = list(purpose_buildings)

    return JsonResponse(purpose_building_options, safe=False)


def view_index(request: HttpRequest) -> HttpResponse:
    objects = FulfilledOrder.objects.all()
    response = HttpResponseRedirect(reverse('expert:order'))

    request.session.modified = True
    try:
        request.session.pop('cadastral_numbers')
        request.session.pop('address')
    except KeyError:
        pass

    if 'cadastral_numbers' in request.POST:
        cadastral_numbers = request.POST.getlist('cadastral_numbers')
        request.session['cadastral_numbers'] = cadastral_numbers

        return response

    if 'address' in request.POST:
        address = request.POST.getlist('address')
        request.session['address'] = address

        return response

    if 'files' in request.FILES:
        files = request.FILES.getlist('files')
        cadastral_numbers = []
        for file in files:
            file_extension = os.path.splitext(file.name)[-1]
            if file_extension == '.pdf':
                reader = PdfReader(file)
                page = reader.pages[0]
                pdf_text = StringIO(page.extract_text())
                for text in pdf_text:
                    if 'Кадастровый номер' in text.strip():
                        cadastral = text.strip().split(' ')[-1]
                        cadastral_numbers.append(cadastral)
                request.session['cadastral_numbers'] = cadastral_numbers
            else:
                file = request.FILES.get('files').close()
                messages.error(request, 'Ошибка обработки файла')
                break

    return render(request, "geoexpert/index.html", context={'objects': objects})


@transaction.atomic
def view_order(request: HttpRequest) -> HttpResponse:
    coordinates = []
    context = {}
    square_cadastral_area = []

    cadastral_numbers = request.session[
        'cadastral_numbers'
    ] if 'cadastral_numbers' in request.session else None
    address = request.session[
        'address'
    ] if 'address' in request.session else None

    if address:
        region, area, city = address[0].split(', ')

    if cadastral_numbers:
        cadastral_region = Region.objects.get(
            cadastral_region_number=cadastral_numbers[0].split(':')[0])
        cadastral_area = Area.objects.get(
            cadastral_area_number=cadastral_numbers[0].split(':')[1])

    if request.method == 'POST':
        order_form = OrderForm(request.POST)
        order_files_form = OrderFileForm(request.POST, request.FILES)
        if order_form.is_valid() and order_files_form.is_valid():
            order = order_form.save()
            if cadastral_numbers:
                new_cadastral_numbers = request.POST.getlist(
                    'new_cadastral_numbers')
                if new_cadastral_numbers:
                    cadastral_numbers += new_cadastral_numbers
                order.coordinates = coordinates
                order.cadastral_numbers = cadastral_numbers
            order.save()

            for file in request.FILES.getlist('file'):
                CurrentOrderFile.objects.create(order=order, file=file)
            messages.success(request, 'Ваша заявка отправлена')

            return HttpResponseRedirect(reverse('expert:index'))

    else:
        order_form = OrderForm(initial={
            'cadastral_numbers': cadastral_numbers if cadastral_numbers
            else None,

            'region': cadastral_region.id if cadastral_numbers
            else Region.objects.get(name=region).id,

            'area': cadastral_area.id if cadastral_numbers
            else Area.objects.get(name=area).id,

            'city': None if cadastral_numbers
            else City.objects.get(name=city).id,

            'square_unit': CurrentOrder.SQUARE_UNIT[0][0],
        })

        order_files_form = OrderFileForm()

    context['squares'] = square_cadastral_area
    context['order_form'] = order_form
    context['order_files_form'] = order_files_form
    context['purpose_building'] = PurposeBuilding.objects.all()
    context['cadastral_numbers'] = cadastral_numbers

    return render(request, 'geoexpert/order.html', context=context)


def view_card(request: HttpRequest) -> HttpResponse:
    order = FulfilledOrderImages.objects.all().first()

    return render(request, 'geoexpert/card.html', context={'order': order})


def view_map_maker(request):
    return render(request, 'geoexpert/map_maker.html')

def view_order_pages(request):
    orders = CurrentOrder.objects.all().select_related('city', 'area', 'region', 'work_objective')
    context = {
        "orders": orders,
    }

    return render(request, 'geoexpert/order_pages.html', context=context)
