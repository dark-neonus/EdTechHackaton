# filepath: /mnt/D/code/hackatons/EdTechHackaton/meowls/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'skill-plans', views.SkillPlanViewSet, basename='skill-plan')
router.register(r'skills', views.SkillViewSet, basename='skill')
router.register(r'resources', views.ResourceViewSet, basename='resource')

app_name = 'api'

urlpatterns = [
    path('', include(router.urls)),
    path('generate-plan/', views.generate_skill_plan_api, name='generate_plan'),
]