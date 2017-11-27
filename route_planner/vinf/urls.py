from django.conf.urls import url

from . import views

app_name = 'vinf'

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^autocomplete$',views.autocomplete, name='autocomplete'),
    ]
