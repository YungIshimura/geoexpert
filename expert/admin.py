from django.contrib import admin
from .models import Order, TypeWork, WorkObjective, PurposeBuilding, ResearchPurpose, Location


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    pass


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