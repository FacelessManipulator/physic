from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
import views

urlpatterns = [
    url(r'^website$', views.opt_website_setting),
    url(r'^login$', views.m_login,name='usersystem-login'),
    url(r'^regist$', views.RegisterView.as_view(),name='usersystem-regist'),
    url(r'^reset-password$', views.reset_password),
    url(r'^temp$',views.tempView,name='usersystem-temp'),
    url(r'^capture$', views.g_capture,name='usersystem-capture'),
    url(r'^verifyMail$', views.verify_mail),
    url(r'^change-head-img$', views.changeHeadImg),
    url(r'^change-password$', views.changePassword),
    url(r'^basic-setting$', views.settings),
    url(r'^all$', views.opt_user),
    url(r'^find$', views.opt_user),
    url(r'^add$', views.add_user),
    url(r'^delete$', views.delete_user),
    url(r'^modify$', views.modify_user),
    url(r'^report$', views.get_report),
    # url(r'^report/brush$', views.get_report),
    url(r'^report/modify$', views.modify_report),
    url(r'^report/image$', views.receive_image),
    url(r'^report/file$', views.receive_file),
    url(r'^report/tag', views.opt_tag),
    url(r'^report/data-table/add', views.save_data_table),
    url(r'^report/data-table/delete', views.delete_data_table),
    url(r'^institute', views.opt_institute),
    url(r'^major', views.opt_major),
    url(r'^class', views.opt_class),
    url(r'^submit$', views.submit_report),
    url(r'^push-back$', views.push_back_report),
]

#urlpatterns = format_suffix_patterns(urlpatterns)
'''
    url(r'^/$', views.SnippetList.as_view(),name='snippet-list'),
    url(r'^login/$', views.SnippetList.as_view(),name='snippet-list'),
    url(r'^logout/$', views.SnippetList.as_view(),name='snippet-list'),
    url(r'^student/$', views.SnippetDetail.as_view(),name='snippet-detail'),
    url(r'^student/(?P<pk>[0-9]+)/$', views.UserDetail.as_view(),name='user-detail'),
    url(r'^teacher/$', views.UserList.as_view(),name='user-list'),
    url(r'^teacher/(?P<pk>[0-9]+)/$', views.UserDetail.as_view(),name='user-detail'),
    url(r'^/$', views.SnippetList.as_view(),name='snippet-list'),
    url(r'^$', views.api_root),
    '''
