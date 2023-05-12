from __future__ import absolute_import, unicode_literals
from celery import shared_task
from selenium import webdriver
import time
import os
from django.conf import settings
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404

from .map_funcs import get_map_screenshot
from .models import CurrentOrder, get_screenshot_path


@shared_task
def create_map_screenshot_task(order_id, cadastral_numbers):
    order = get_object_or_404(CurrentOrder, id=order_id)
    tmp_html = os.path.join(
        settings.BASE_DIR, 'tmp', f'map-{order_id}.html')
    tmp_png = os.path.join(
        settings.BASE_DIR, 'tmp', f'map-{order_id}.png')

    get_map_screenshot(cadastral_numbers).save(tmp_html)

    driver = webdriver.Chrome()
    driver.get(f'file://{tmp_html}')
    time.sleep(1)
    driver.save_screenshot(tmp_png)
    driver.quit()

    img_path = get_screenshot_path(order, 'map.png')

    if order.map and os.path.isfile(order.map.path):
        os.remove(order.map.path)

    with open(tmp_png, 'rb') as f:
        order.map.save(img_path, ContentFile(f.read()), save=True)

    os.remove(tmp_html)
    os.remove(tmp_png)