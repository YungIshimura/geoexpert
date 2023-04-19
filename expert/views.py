from django.shortcuts import render
from .models import Order

# Create your views here.
def view_index(request):
    return render(request, "geoexpert/index.html")


def view_card(request):
    order = Order.objects.all().first()

    return render(request, 'geoexpert/card.html', context={'order': order})