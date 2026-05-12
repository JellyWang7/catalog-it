from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from .config import get_settings
from .models import EnrichRequest, EnrichResponse

_SYSTEM = """You are a catalog assistant. Given an item in a user's catalog, return JSON \
with exactly two keys: "tags" (array of 2-5 lowercase strings) and "description" (one \
factual sentence). Tags must be specific and useful for filtering. Content must be \
appropriate for all ages."""

_HUMAN = """Item name: {item_name}
Category: {item_category}
List: {list_title}
Existing notes: {existing_notes}

Return JSON only."""


def _build_llm():
    settings = get_settings()
    if settings.environment == "development":
        from langchain_ollama import ChatOllama
        return ChatOllama(model=settings.ollama_model, temperature=0, format="json")
    from langchain_aws import ChatBedrock
    return ChatBedrock(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
        model_kwargs={"temperature": 0},
    )


def build_enrich_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM),
        ("human", _HUMAN),
    ])
    return prompt | _build_llm() | JsonOutputParser(pydantic_object=EnrichResponse)


def enrich_item(req: EnrichRequest) -> EnrichResponse:
    chain = build_enrich_chain()
    result = chain.invoke(req.model_dump())
    return EnrichResponse(**result)
