from django.db import models
from django.contrib.auth.models import User

class SkillPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_plans')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"

class Skill(models.Model):
    plan = models.ForeignKey(SkillPlan, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=200)
    description = models.TextField()
    estimated_hours = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name

class Resource(models.Model):
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='resources')
    name = models.CharField(max_length=200)
    url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name