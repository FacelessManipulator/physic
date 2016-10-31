"""physicLab1000 URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Import the include() function: from django.conf.urls import url, include
    3. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import url, include
from django.contrib import admin
import views
from usersystem import views as user_views
from experiment.views import index
from django.conf import settings

urlpatterns = [
    url(r'^$', index),
    url(r'^first-login$', user_views.first_login),
    url(r'^login$', user_views.m_login),
    url(r'^logout', user_views.m_logout),
    url(r'^setting', user_views.settings),
    url(r'^user/', include('usersystem.urls')),
    url(r'^experiment/', include('experiment.urls')),
    url(r'^api-auth/', include('rest_framework.urls',namespace='rest_framework')),
    url(r'^captcha/',include('captcha.urls')),
]