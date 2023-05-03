from django.contrib import admin
from .models import FulfilledOrder, TypeWork, WorkObjective, PurposeBuilding, ResearchPurpose, Location, \
    FulfilledOrderImages, CurrentOrder, CurrentOrderFile, Region, Area, City, Department, PurposeGroup
from users.models import User


class OrderImagesInline(admin.TabularInline):
    model = FulfilledOrderImages
    extra = 1


@admin.register(FulfilledOrder)
class OrderAdmin(admin.ModelAdmin):
    model = FulfilledOrder
    fields = ['name', 'address', 'location', 'cadastral_numbers', 'coords',
              'purpose_building', 'is_liner', 'square', 'length', 'project_organisation',
              'general_contractor', 'customer', 'work_objective', 'type_work',
              'research_purpose', 'year']
    inlines = [OrderImagesInline]

    class Media:
        js = ('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
              '/static/admin/js/assets_admin.js',)


@admin.register(CurrentOrder)
class CurrentOrderAdmim(admin.ModelAdmin):
    pass


@admin.register(CurrentOrderFile)
class CurrentOrderFileAdmin(admin.ModelAdmin):
    pass


@admin.register(Region)
class RedionAdmin(admin.ModelAdmin):
    pass


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    pass


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
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


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    pass


@admin.register(FulfilledOrderImages)
class OrderImagesAdmin(admin.ModelAdmin):
    pass

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    pass

@admin.register(PurposeGroup)
class PurposeGroupAdmin(admin.ModelAdmin):
    pass

