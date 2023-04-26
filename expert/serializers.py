from rest_framework import serializers
from .models import FulfilledOrder, FulfilledOrderImages, TypeWork, WorkObjective


class OrderImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField('get_image_url')
    class Meta:
        model = FulfilledOrderImages
        fields = ('image_url', )

    def get_image_url(self, obj):
        return obj.image.url

class TypeWorkSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeWork
        fields = ('type',)


class WorkObjectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkObjective
        fields = ('objective',)


class OrderSelializer(serializers.ModelSerializer):
    images = OrderImageSerializer(many=True, allow_empty=True)
    type_work = TypeWorkSerializer(many=True, allow_empty=True)
    work_objective = WorkObjectiveSerializer(many=False)
    class Meta:
        model = FulfilledOrder
        fields = ('name', 'type_work', 'customer', 'work_objective', 'year', 'images')
