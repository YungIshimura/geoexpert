from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.urls import reverse


class UserTestCase(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            password='12test12', username='test', phone_number='+79186782222')
        self.user.save()
        self.authorized_client = Client()
        self.authorized_client.force_login(self.user)

    def test_correct(self):
        user = authenticate(username='test', password='12test12')
        self.assertTrue((user is not None) and user.is_authenticated)

    def test_wrong_username(self):
        user = authenticate(username='test123', password='12test12')
        self.assertFalse(user is not None and user.is_authenticated)

    def test_wrong_password(self):
        user = authenticate(username='test', password='12test12123')
        self.assertFalse(user is not None and user.is_authenticated)

    def test_wrong_pssword(self):
        user = authenticate(username='test', password='wrong')
        self.assertFalse(user is not None and user.is_authenticated)

    def test_logout(self):
        user = self.client.logout()
        self.assertFalse(user and user.is_authenticated)

    def test_user_profile(self):
        response = self.authorized_client.get(reverse('users:profile'))
        self.assertEqual(response.status_code, 200)

    def test_wrong_user_profile(self):
        response = self.client.get(reverse('users:profile'))
        self.assertNotEqual(response.status_code, 200)

        