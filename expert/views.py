from django.shortcuts import render
from .models import Order, OrderImages
from rest_framework import generics
from .serializers import OrderSelializer
from .permissions import IsOwnerOrReadOnly


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSelializer
    queryset = Order.objects.all()
    permission_classes = (IsOwnerOrReadOnly,)


def view_index(request):
    objects = Order.objects.all()

    return render(request, "geoexpert/index.html", context={'objects': objects})


def view_card(request):
    order = Order.objects.all().first()

    return render(request, 'geoexpert/card.html', context={'order': order})
