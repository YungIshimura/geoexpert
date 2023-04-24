from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from .models import Order


def view_index(request):
    objects = Order.objects.all()
    return render(request, "geoexpert/index.html", context={'objects': objects})


def view_card(request):
    order = Order.objects.all().first()

    return render(request, 'geoexpert/card.html', context={'order': order})

def view_detail_order(request, pk):
    order = get_object_or_404(Order, pk=pk)
    images = [image.image.url for image in order.images.all()]
    data = {
        'name': order.name,
        'type_work': list(order.type_work.values_list('type', flat=True)),
        'customer': order.customer,
        'work_objective': order.work_objective.objective,
        'year': order.year,
        'images': images,
    }
    return JsonResponse(data)
