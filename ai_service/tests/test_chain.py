import pytest
from unittest.mock import patch
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from enrich.chain import build_enrich_chain, enrich_item
from enrich.models import EnrichRequest, EnrichResponse

SAMPLE_REQUEST = EnrichRequest(
    item_name="Inception",
    item_category="movies",
    list_title="My Watchlist",
)


def _make_fake_llm(response: str) -> FakeListChatModel:
    return FakeListChatModel(responses=[response])


class TestEnrichChainUnit:
    def test_chain_returns_dict_with_tags_and_description(self, fake_llm):
        with patch("enrich.chain._build_llm", return_value=fake_llm):
            chain = build_enrich_chain()
            result = chain.invoke(SAMPLE_REQUEST.model_dump())
        assert isinstance(result, dict)
        assert "tags" in result
        assert "description" in result

    def test_tags_are_list_of_strings(self, fake_llm):
        with patch("enrich.chain._build_llm", return_value=fake_llm):
            chain = build_enrich_chain()
            result = chain.invoke(SAMPLE_REQUEST.model_dump())
        assert isinstance(result["tags"], list)
        assert all(isinstance(t, str) for t in result["tags"])

    def test_description_is_non_empty_string(self, fake_llm):
        with patch("enrich.chain._build_llm", return_value=fake_llm):
            chain = build_enrich_chain()
            result = chain.invoke(SAMPLE_REQUEST.model_dump())
        assert isinstance(result["description"], str)
        assert len(result["description"]) > 10

    def test_existing_notes_field_accepted_without_error(self):
        """Verifies the chain accepts optional existing_notes without raising."""
        llm = _make_fake_llm(
            '{"tags": ["epic", "sci-fi"], "description": "A desert planet saga."}'
        )
        req = EnrichRequest(
            item_name="Dune",
            item_category="books",
            list_title="Reading List",
            existing_notes="Started reading, very dense",
        )
        with patch("enrich.chain._build_llm", return_value=llm):
            chain = build_enrich_chain()
            result = chain.invoke(req.model_dump())
        assert result["tags"] == ["epic", "sci-fi"]


@pytest.mark.integration
class TestEnrichChainIntegration:
    """Requires Ollama running: `ollama pull llama3.2:3b && ollama serve`"""

    def test_real_llm_returns_valid_response(self):
        result = enrich_item(SAMPLE_REQUEST)
        assert isinstance(result, EnrichResponse)
        assert len(result.tags) >= 2
        assert len(result.description) > 10

    def test_tags_are_lowercase(self):
        result = enrich_item(SAMPLE_REQUEST)
        assert all(t == t.lower() for t in result.tags)
