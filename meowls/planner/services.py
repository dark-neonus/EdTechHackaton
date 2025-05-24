import json
import openai
from django.conf import settings

openai.api_key = settings.OPENAI_API_KEY

def generate_skill_plan(goal, num_skills=10, additional_info=None):
    """
    Generate a skill plan using OpenAI's GPT model
    
    Args:
        goal: The target skill or role (e.g., "Junior Front-End Developer")
        num_skills: Number of subskills to generate
        additional_info: Additional context about the user's background or preferences
        
    Returns:
        dict: JSON object containing the skill plan
    """
    # Construct the prompt
    prompt = f"""
    Create a detailed learning path for someone who wants to become a {goal}.
    Generate a JSON object with {num_skills} essential skills needed to achieve this goal.
    
    Each skill should include:
    - name: The name of the skill
    - description: A detailed description of the skill and why it's important
    - resources: A list of at least 3 specific learning resources (books, courses, websites, etc.)
    - estimated_hours: An estimate of how many hours it would take to learn this skill
    """
    
    if additional_info:
        prompt += f"\nAdditional context about the learner: {additional_info}"
    
    prompt += "\nProvide the response as a valid JSON object with a 'skills' key containing an array of skills."
    
    try:
        # Call the OpenAI API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert educational curriculum designer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2500,
        )
        
        # Extract the response text
        response_text = response.choices[0].message.content
        
        # Parse the JSON response
        # Sometimes OpenAI adds markdown formatting, so we need to clean it up
        if "```json" in response_text:
            # Extract the JSON part from markdown code blocks
            json_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            # Extract from generic code blocks
            json_text = response_text.split("```")[1].split("```")[0].strip()
        else:
            # Use the raw response
            json_text = response_text
        
        skill_plan = json.loads(json_text)
        return skill_plan
    
    except Exception as e:
        # Handle errors gracefully
        return {
            "error": str(e),
            "skills": [
                {
                    "name": "Error generating skills",
                    "description": f"There was an error with the OpenAI API: {str(e)}",
                    "resources": [],
                    "estimated_hours": 0
                }
            ]
        }