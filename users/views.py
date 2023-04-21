from django.shortcuts import render
from django.urls import reverse
from django.http import HttpResponseRedirect
from .forms import UserProfileForm, UserLoginForm
from django.contrib.auth.decorators import login_required
from django.contrib import auth


def view_login(request):
    if request.method == 'POST':
        form = UserLoginForm(data=request.POST)
        if form.is_valid():
            username = request.POST['username']
            password = request.POST['password']
            user = auth.authenticate(username=username, password=password)
            if user and user.is_active:
                auth.login(request, user)

                return HttpResponseRedirect(reverse('expert:index'))
    else:
        form = UserLoginForm()

    context = {
        'form': form
    }

    return render(request, 'users/login.html', context)



@login_required(login_url='users:login')
def view_profile(request):
    user=request.user
    if request.method == 'POST':
        form = UserProfileForm(data=request.POST, files=request.FILES, instance=user)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse('users:profile'))
    else:
        form = UserProfileForm(instance=user)

    context = {
        'form': form,
        'groups': [group.name for group in user.groups.all()]
    }
    return render(request, 'users/profile.html', context=context)