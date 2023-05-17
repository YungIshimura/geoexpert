from django.test import TestCase
from expert.models import (Area, City, Region, TypeWork, Department,
                           WorkObjective, ResearchPurpose, PurposeGroup,
                           PurposeBuilding, WorkObjective, FulfilledOrder,
                           FulfilledOrderImages, CurrentOrder, CurrentOrderFile)

class ModelsTestCase(TestCase):
    @classmethod
    def test_area(self):
        pass
