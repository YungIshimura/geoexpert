from django.contrib import admin
from .models import Order, TypeWork, WorkObjective, PurposeBuilding, ResearchPurpose, Location
from users.models import User


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    model = Order
    fields = [field.name for field in Order._meta.get_fields()
              if field.name != 'id']

    class Media:
        js = ('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
              '/static/admin/js/assets_admin.js',)


@admin.register(TypeWork)
class TypeWorkAdmin(admin.ModelAdmin):
    pass


@admin.register(WorkObjective)
class WorkObjectiveAdmin(admin.ModelAdmin):
    pass


@admin.register(PurposeBuilding)
class PurposeBuildingAdmib(admin.ModelAdmin):
    pass


@admin.register(ResearchPurpose)
class ResearchPurposeAdmin(admin.ModelAdmin):
    pass


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    pass


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    pass