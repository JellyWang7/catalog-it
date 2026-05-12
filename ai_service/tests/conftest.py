import pytest
from langchain_core.language_models.fake_chat_models import FakeListChatModel


@pytest.fixture
def fake_llm():
    """A proper LangChain Runnable that returns valid JSON enrichment output."""
    return FakeListChatModel(responses=[
        '{"tags": ["sci-fi", "film", "mind-bending"], '
        '"description": "A thief who steals secrets through dreams."}'
    ])
