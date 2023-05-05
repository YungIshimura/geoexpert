from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import re


def validate_number(value):
    validate_number_status = re.fullmatch(
        r'[0-9]{2}:[0-9]{2}:[0-9]{5,7}:[0-9]{1,4}', value
    )
    if not validate_number_status:
        raise ValidationError(
            _('%(value)s - неверный номер. Убедитесь в правильности написания'),
            params={'value': value},
        )
