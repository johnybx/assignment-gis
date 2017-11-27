from django.conf.urls import url

from . import views

app_name = 'routeplanner'

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^find_route$', views.find_route, name="find_route"),
    ]
