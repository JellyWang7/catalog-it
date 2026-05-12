import os
from functools import lru_cache


class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    bedrock_model_id: str = os.getenv(
        "BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"
    )
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")


@lru_cache
def get_settings() -> Settings:
    return Settings()
