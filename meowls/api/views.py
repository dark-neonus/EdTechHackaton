from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from planner.models import SkillPlan, Skill, Resource
from .serializers import SkillPlanSerializer, SkillSerializer, ResourceSerializer
from planner.services import generate_skill_plan

class SkillPlanViewSet(viewsets.ModelViewSet):
    serializer_class = SkillPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SkillPlan.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Skill.objects.filter(plan__user=self.request.user).order_by('order')

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Resource.objects.filter(skill__plan__user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_skill_plan_api(request):
    """API endpoint to generate a skill plan"""
    goal = request.data.get('goal')
    num_skills = request.data.get('num_skills', 10)
    additional_info = request.data.get('additional_info')
    
    if not goal:
        return Response({"error": "Goal is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Call the OpenAI service to generate skills
        skill_data = generate_skill_plan(goal, num_skills, additional_info)
        
        # Return the generated data
        return Response(skill_data)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
