from pydantic import BaseModel, Field
from typing import List


class EnrichRequest(BaseModel):
    item_name: str
    item_category: str
    list_title: str
    existing_notes: str = ""


class EnrichResponse(BaseModel):
    tags: List[str] = Field(description="2-5 lowercase descriptive tags")
    description: str = Field(description="One factual sentence for catalog notes")
