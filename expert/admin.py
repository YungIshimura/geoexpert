from django.contrib import admin
from .models import Order, TypeWork, WorkObjective, PurposeBuilding, ResearchPurpose, Location, OrderImages
from users.models import User


class OrderImagesInline(admin.TabularInline):
    model = OrderImages
    extra = 1

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    model = Order
    fields = ['name', 'address', 'location', 'cadastral_numbers', 'coords',
              'purpose_building', 'is_liner', 'square', 'length', 'project_organisation',
              'general_contractor', 'customer', 'work_objective', 'type_work', 
              'research_purpose', 'year', 'status']
    inlines = [OrderImagesInline]

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
