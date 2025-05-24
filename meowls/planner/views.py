from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .models import SkillPlan, Skill, Resource
from .forms import SkillPlanForm, GenerateSkillPlanForm
from .services import generate_skill_plan
import json

@login_required
def dashboard(request):
    """User dashboard showing all their skill plans"""
    skill_plans = SkillPlan.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'planner/dashboard.html', {'skill_plans': skill_plans})

@login_required
def create_plan(request):
    """Create a new skill plan manually"""
    if request.method == 'POST':
        form = SkillPlanForm(request.POST)
        if form.is_valid():
            plan = form.save(commit=False)
            plan.user = request.user
            plan.save()
            messages.success(request, 'Skill plan created successfully!')
            return redirect('planner:plan_detail', plan_id=plan.id)
    else:
        form = SkillPlanForm()
    
    return render(request, 'planner/create_plan.html', {'form': form})

@login_required
def generate_plan(request):
    """Generate a skill plan using OpenAI API"""
    if request.method == 'POST':
        form = GenerateSkillPlanForm(request.POST)
        if form.is_valid():
            goal = form.cleaned_data['goal']
            num_skills = form.cleaned_data['num_skills']
            additional_info = form.cleaned_data['additional_info']
            
            # Call the OpenAI service to generate skills
            skill_data = generate_skill_plan(goal, num_skills, additional_info)
            
            if 'error' in skill_data:
                messages.error(request, f"Error generating plan: {skill_data['error']}")
                return render(request, 'planner/generate_plan.html', {'form': form})
            
            # Create a new skill plan
            plan = SkillPlan.objects.create(
                user=request.user,
                title=f"Learning path for {goal}",
                description=additional_info if additional_info else f"Generated plan for {goal}"
            )
            
            # Create skills from the API response
            for i, skill_info in enumerate(skill_data.get('skills', [])):
                skill = Skill.objects.create(
                    plan=plan,
                    name=skill_info['name'],
                    description=skill_info['description'],
                    estimated_hours=skill_info.get('estimated_hours', 0),
                    order=i
                )
                
                # Create resources for each skill
                for resource_info in skill_info.get('resources', []):
                    if isinstance(resource_info, dict):
                        Resource.objects.create(
                            skill=skill,
                            name=resource_info.get('name', 'Resource'),
                            url=resource_info.get('url', ''),
                            description=resource_info.get('description', '')
                        )
                    elif isinstance(resource_info, str):
                        Resource.objects.create(
                            skill=skill,
                            name=resource_info,
                        )
            
            messages.success(request, 'Skill plan generated successfully!')
            return redirect('planner:plan_detail', plan_id=plan.id)
    else:
        form = GenerateSkillPlanForm()
    
    return render(request, 'planner/generate_plan.html', {'form': form})

@login_required
def plan_detail(request, plan_id):
    """View a specific skill plan"""
    plan = get_object_or_404(SkillPlan, id=plan_id, user=request.user)
    skills = plan.skills.all().order_by('order')
    return render(request, 'planner/plan_detail.html', {'plan': plan, 'skills': skills})

@login_required
def update_skill_status(request, skill_id):
    """Toggle the completion status of a skill"""
    if request.method == 'POST':
        skill = get_object_or_404(Skill, id=skill_id, plan__user=request.user)
        skill.completed = not skill.completed
        skill.save()
        return JsonResponse({'status': 'success', 'completed': skill.completed})
    return JsonResponse({'status': 'error'}, status=400)

@login_required
def delete_plan(request, plan_id):
    """Delete a skill plan"""
    plan = get_object_or_404(SkillPlan, id=plan_id, user=request.user)
    
    if request.method == 'POST':
        plan.delete()
        messages.success(request, 'Skill plan deleted successfully!')
        return redirect('planner:dashboard')
    
    return render(request, 'planner/delete_plan.html', {'plan': plan})
