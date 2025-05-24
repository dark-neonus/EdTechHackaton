# filepath: /mnt/D/code/hackatons/EdTechHackaton/meowls/api/serializers.py
from rest_framework import serializers
from planner.models import SkillPlan, Skill, Resource
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'name', 'url', 'description']

class SkillSerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description', 'estimated_hours', 'completed', 'order', 'resources']

class SkillPlanSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SkillPlan
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'user', 'skills']