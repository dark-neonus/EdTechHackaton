from sqlmodel import SQLModel, Field

class Post(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    title: str = Field(max_length=100)
    content: str
    user_id: int = Field(foreign_key="user.id")  # Assuming a User model exists in authentication app

    class Config:
        orm_mode = True