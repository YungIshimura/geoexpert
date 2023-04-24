from django.contrib.auth.forms import AuthenticationForm, UserChangeForm
from .models import User
from django import forms
from phonenumber_field.formfields import PhoneNumberField


class UserLoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={
        'placeholder': 'Введите имя пользователя'
    }))
    password = forms.CharField(widget=forms.PasswordInput(attrs={
        'placeholder': 'Введите пароль'
    }))

    class Meta:
        model = User
        fields = ('username', 'password')

    def __init__(self, *args, **kwargs):
        super(UserLoginForm, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'


class UserProfileForm(UserChangeForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={'read_only': True}))
    phone_number = PhoneNumberField(widget=forms.TextInput(attrs={'placeholder': 'Ваш номер телефона'}))
    email = forms.CharField(widget=forms.EmailInput(attrs={'placeholder': 'Ваша электронная почта'}))
    first_name = forms.CharField(widget=forms.TextInput(attrs={'placeholder': 'Ваше имя'}))
    last_name = forms.CharField(widget=forms.TextInput(attrs={'placeholder': 'Ваша фамилия'}))
    father_name = forms.CharField(widget=forms.TextInput(attrs={'placeholder': 'Ваше отчество'}))

    class Meta:
        model = User
        fields = ('username', 'phone_number', 'email', 'first_name', 'last_name', 'father_name')

    def __init__(self, *args, **kwargs):
        super(UserProfileForm, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'