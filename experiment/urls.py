#coding=utf-8

from django.conf.urls import url
import views

urlpatterns = [
    url(r'^$', views.index),
    url(r'^all$', views.get_experiment),
    url(r'^sub$', views.get_sub_experiment),
    url(r'^add$', views.add_experiment),
    url(r'^delete$', views.delete_experiment),
    url(r'^modify$', views.modify_experiment),
    url(r'^base/add$', views.add_base_experiment),
    url(r'^base/all$', views.get_all_experiment),
    url(r'^base/delete$', views.delete_base_experiment),
    url(r'^base/modify$', views.modify_base_experiment),
    url(r'^user/add$', views.user_add_experiment),
    url(r'^user/delete$', views.user_delete_experiment),
    ]