# filepath: /mnt/D/code/hackatons/EdTechHackaton/meowls/planner/urls.py
from django.urls import path
from . import views

app_name = 'planner'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('plan/create/', views.create_plan, name='create_plan'),
    path('plan/generate/', views.generate_plan, name='generate_plan'),
    path('plan/<int:plan_id>/', views.plan_detail, name='plan_detail'),
    path('plan/<int:plan_id>/delete/', views.delete_plan, name='delete_plan'),
    path('skill/<int:skill_id>/update-status/', views.update_skill_status, name='update_skill_status'),
]