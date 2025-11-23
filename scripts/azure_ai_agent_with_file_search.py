"""
azure_ai_agent_with_file_search.py

Create an Azure AI "Agent" that can search local files and answer
questions using an Azure OpenAI deployment. The script does NOT
provision Azure resources; it connects to an existing Azure OpenAI
deployment via the REST API.

Usage:
  - Set environment variables `AZURE_OPENAI_ENDPOINT` and
    `AZURE_OPENAI_KEY` and `AZURE_OPENAI_DEPLOYMENT` (chat/deploy name).
  - Optionally set `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` for embeddings.
  - Call the `Agent` class in your application.

Features:
  - Indexes files recursively from a directory.
  - Uses Azure OpenAI embeddings (if configured) to do semantic search.
  - Falls back to a simple keyword-frequency search when embeddings
    are not available.
  - Sends retrieved file snippets to the Azure OpenAI chat completion
    endpoint to generate answers with context.

Dependencies: `requests` (install with `pip install requests`).

This module follows basic Python typing and PEP8 guidelines.
"""
from __future__ import annotations

import os
import json
import pathlib
import logging
from typing import Dict, List, Optional, Tuple

import requests

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _read_text_file(path: pathlib.Path) -> str:
    """Read a text file and return its content.

    Binary files are skipped by attempting to decode as UTF-8 and
    falling back to latin-1.
    """
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="latin-1")
        except Exception:
            logger.debug("Skipping binary or unreadable file: %s", path)
            return ""


class FileIndex:
    """A minimal file index that supports semantic and keyword search.

    If an Azure embeddings deployment is configured, calls the Azure
    embeddings endpoint and stores embeddings for vector search. If not,
    falls back to a keyword frequency based scorer.
    """

    def __init__(
        self,
        root: str,
        azure_endpoint: Optional[str] = None,
        azure_key: Optional[str] = None,
        embedding_deployment: Optional[str] = None,
        api_version: str = "2023-06-01-preview",
    ) -> None:
        self.root = pathlib.Path(root)
        self.docs: Dict[str, str] = {}
        self.embeddings: Dict[str, List[float]] = {}
        self.azure_endpoint = azure_endpoint
        self.azure_key = azure_key
        self.embedding_deployment = embedding_deployment
        self.api_version = api_version

    def index_files(self, patterns: Optional[List[str]] = None) -> None:
        """Recursively index files under `root`.

        patterns: optional list of glob patterns to include (e.g. ["*.py"]).
        If not provided, all files are considered.
        """
        for path in self.root.rglob("*"):
            if path.is_file():
                if patterns:
                    if not any(path.match(p) for p in patterns):
                        continue
                text = _read_text_file(path)
                if text.strip():
                    self.docs[str(path)] = text
        logger.info("Indexed %d files", len(self.docs))

    def _call_azure_embedding(self, text: str) -> List[float]:
        assert self.azure_endpoint and self.azure_key and self.embedding_deployment
        url = f"{self.azure_endpoint.rstrip('/')}/openai/deployments/{self.embedding_deployment}/embeddings?api-version={self.api_version}"
        headers = {"api-key": self.azure_key, "Content-Type": "application/json"}
        payload = {"input": text}
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        r.raise_for_status()
        data = r.json()
        return data["data"][0]["embedding"]

    def build_embeddings(self, force: bool = False) -> None:
        """Build embeddings for all documents if an embedding deployment is set.

        If no embedding deployment is configured, this is a no-op.
        """
        if not (self.azure_endpoint and self.azure_key and self.embedding_deployment):
            logger.info("Embeddings not configured; skipping semantic index.")
            return
        if self.embeddings and not force:
            logger.info("Embeddings already built; set force=True to rebuild.")
            return
        logger.info("Building embeddings for %d documents", len(self.docs))
        for path, text in self.docs.items():
            try:
                emb = self._call_azure_embedding(text)
                self.embeddings[path] = emb
            except Exception:
                logger.exception("Failed to get embedding for %s", path)

    def _keyword_score(self, query: str, text: str) -> int:
        q_tokens = [t.lower() for t in query.split() if t.strip()]
        if not q_tokens:
            return 0
        score = 0
        lowered = text.lower()
        for t in q_tokens:
            score += lowered.count(t)
        return score

    def _cosine_sim(self, a: List[float], b: List[float]) -> float:
        # simple cosine similarity; assume non-empty vectors
        import math

        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        if na == 0 or nb == 0:
            return 0.0
        return dot / (na * nb)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, str, float]]:
        """Search documents and return a list of tuples (path, snippet, score).

        Uses embeddings if available, otherwise keyword frequency scoring.
        """
        if self.embeddings and self.azure_endpoint and self.azure_key and self.embedding_deployment:
            try:
                q_emb = self._call_azure_embedding(query)
                scored = []
                for path, emb in self.embeddings.items():
                    score = self._cosine_sim(q_emb, emb)
                    snippet = self.docs.get(path, "")[:2000]
                    scored.append((path, snippet, score))
                scored.sort(key=lambda x: x[2], reverse=True)
                return scored[:top_k]
            except Exception:
                logger.exception("Embedding search failed; falling back to keyword search")

        # fallback keyword search
        scored = []
        for path, text in self.docs.items():
            score = self._keyword_score(query, text)
            if score > 0:
                snippet = text[:2000]
                scored.append((path, snippet, float(score)))
        scored.sort(key=lambda x: x[2], reverse=True)
        return scored[:top_k]


class Agent:
    """A simple agent that queries files and uses Azure OpenAI chat to answer.

    Example:
        agent = Agent(files_dir="./", deployment="gpt-deploy")
        agent.index_and_build()
        print(agent.answer("How does authentication work?"))
    """

    def __init__(
        self,
        files_dir: str,
        azure_endpoint: Optional[str] = None,
        azure_key: Optional[str] = None,
        chat_deployment: Optional[str] = None,
        embedding_deployment: Optional[str] = None,
        api_version: str = "2023-06-01-preview",
    ) -> None:
        self.azure_endpoint = azure_endpoint or os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.azure_key = azure_key or os.environ.get("AZURE_OPENAI_KEY")
        self.chat_deployment = chat_deployment or os.environ.get("AZURE_OPENAI_DEPLOYMENT")
        self.embedding_deployment = embedding_deployment or os.environ.get(
            "AZURE_OPENAI_EMBEDDING_DEPLOYMENT"
        )
        if not (self.azure_endpoint and self.azure_key and self.chat_deployment):
            logger.warning(
                "Azure endpoint/key/deployment not fully configured. Chat calls will fail without them."
            )
        self.index = FileIndex(
            files_dir,
            azure_endpoint=self.azure_endpoint,
            azure_key=self.azure_key,
            embedding_deployment=self.embedding_deployment,
            api_version=api_version,
        )

    def index_and_build(self, patterns: Optional[List[str]] = None, force_embeddings: bool = False) -> None:
        """Index files from the provided directory and build embeddings if configured."""
        self.index.index_files(patterns)
        self.index.build_embeddings(force=force_embeddings)

    def _call_chat(self, messages: List[Dict], max_tokens: int = 512, temperature: float = 0.0) -> Dict:
        assert self.azure_endpoint and self.azure_key and self.chat_deployment
        url = f"{self.azure_endpoint.rstrip('/')}/openai/deployments/{self.chat_deployment}/chat/completions?api-version=2023-05-15"
        headers = {"api-key": self.azure_key, "Content-Type": "application/json"}
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        r = requests.post(url, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()

    def answer(self, question: str, top_k: int = 5) -> str:
        """Search files for context and ask Azure OpenAI to answer with that context."""
        hits = self.index.search(question, top_k=top_k)
        context_parts = []
        for path, snippet, score in hits:
            context_parts.append(f"Path: {path}\n---\n{snippet}\n")

        system_prompt = (
            "You are an assistant that answers questions using the provided repository files. "
            "When you can't find the answer in the context, be explicit that the answer is not present."
        )
        user_prompt = (
            "Given the following file excerpts, answer the question.\n\n"
            f"Context:\n{'
'.join(context_parts)}\n\nQuestion: {question}"
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        if not (self.azure_endpoint and self.azure_key and self.chat_deployment):
            raise RuntimeError("Azure OpenAI configuration missing; cannot call chat endpoint.")

        resp = self._call_chat(messages)
        choice = resp.get("choices", [])[0]
        content = choice.get("message", {}).get("content") or choice.get("text")
        return content


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run a local Azure AI Agent with file search.")
    parser.add_argument("--files-dir", default=".", help="Directory to index")
    parser.add_argument("--question", required=True, help="Question to ask the agent")
    parser.add_argument("--top-k", type=int, default=5, help="Number of documents to retrieve")
    args = parser.parse_args()

    agent = Agent(files_dir=args.files_dir)
    agent.index_and_build()
    try:
        answer = agent.answer(args.question, top_k=args.top_k)
        print("Answer:\n")
        print(answer)
    except Exception as exc:
        logger.exception("Failed to get answer: %s", exc)

