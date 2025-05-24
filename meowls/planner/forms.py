# filepath: /mnt/D/code/hackatons/EdTechHackaton/meowls/planner/forms.py
from django import forms
from .models import SkillPlan, Skill, Resource

class SkillPlanForm(forms.ModelForm):
    class Meta:
        model = SkillPlan
        fields = ['title', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

class SkillForm(forms.ModelForm):
    class Meta:
        model = Skill
        fields = ['name', 'description', 'estimated_hours']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }

class ResourceForm(forms.ModelForm):
    class Meta:
        model = Resource
        fields = ['name', 'url', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 2}),
        }

class GenerateSkillPlanForm(forms.Form):
    goal = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'placeholder': 'e.g., Junior Front-End Developer'}),
        help_text="What skill or role would you like to learn?"
    )
    num_skills = forms.IntegerField(
        min_value=3,
        max_value=20,
        initial=10,
        help_text="How many skills should be included in your plan?"
    )
    additional_info = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': 'Your background, experience level, or specific interests'}),
        help_text="Optional: Include any additional context about yourself"
    )