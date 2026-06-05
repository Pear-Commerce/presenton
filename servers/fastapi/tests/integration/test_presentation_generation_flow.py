import asyncio
import uuid
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import HTTPException

from api.v1.ppt.endpoints import presentation as presentation_endpoint
from models.generate_presentation_request import GeneratePresentationRequest
from models.presentation_and_path import PresentationAndPath
from models.presentation_outline_model import SlideOutlineModel
from models.presentation_structure_model import PresentationStructureModel
from models.sql.presentation import PresentationModel
from templates.presentation_layout import PresentationLayoutModel, SlideLayoutModel
from tests.conftest import FakeAsyncSession


def _run(coro):
    return asyncio.run(coro)


def _mock_layout() -> PresentationLayoutModel:
    return PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(id="layout-1", name="Title", json_schema={"title": "title"}),
            SlideLayoutModel(id="layout-2", name="Body", json_schema={"title": "body"}),
        ],
    )


def test_generate_presentation_handler_full_flow_uses_mocked_dependencies(fake_async_session):
    request = GeneratePresentationRequest(
        content="Create a two-slide deck about renewable energy.",
        n_slides=2,
        language="English",
        export_as="pptx",
        template="general",
    )
    presentation_id = uuid.uuid4()

    async def fake_outline_stream(*_args, **_kwargs):
        yield '{"slides":[{"content":"## Intro"},{"content":"## Action Plan"}]}'

    get_slide_content = AsyncMock(
        side_effect=[
            {"title": "Intro", "points": ["A"]},
            {"title": "Action Plan", "points": ["B"]},
        ]
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "generate_ppt_outline",
        side_effect=fake_outline_stream,
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=_mock_layout()),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=AsyncMock(return_value=PresentationStructureModel(slides=[0, 1])),
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(
            return_value=PresentationAndPath(
                presentation_id=presentation_id,
                path="/tmp/generated/deck.pptx",
            )
        ),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ), patch.object(
        presentation_endpoint,
        "random",
        new=Mock(randint=Mock(return_value=0)),
    ):
        response = _run(
            presentation_endpoint.generate_presentation_handler(
                request=request,
                presentation_id=presentation_id,
                async_status=None,
                sql_session=fake_async_session,
            )
        )

    assert response.path.endswith(".pptx")
    assert response.edit_path == f"/presentation?id={presentation_id}"
    assert len(fake_async_session.added_all) == 2
    assert all(slide.presentation == presentation_id for slide in fake_async_session.added_all)


def test_generate_presentation_handler_strict_mode_preserves_markdown_table(fake_async_session):
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Cover",
                    "",
                    "Title: Create a Perdue QBR for Walmart vs. Target",
                    "",
                    "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
                ]
            ),
            "\n".join(
                [
                    "### 2. Evidence Table",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            ),
        ],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={
            "locked_text": [
                "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
            ],
            "forbidden_additions": ["checkout optimization"],
            "tables_are_evidence": True,
        },
    )
    presentation_id = uuid.uuid4()
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="layout-1",
                name="Title",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                    },
                },
            ),
            SlideLayoutModel(
                id="layout-2",
                name="Table",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "tableData": {
                            "type": "object",
                            "properties": {
                                "headers": {"type": "array", "maxItems": 4},
                                "rows": {"type": "array", "minItems": 2, "maxItems": 4},
                            },
                        },
                    },
                },
            ),
        ],
    )

    get_layout = AsyncMock(return_value=layout)
    generate_structure = AsyncMock(return_value=PresentationStructureModel(slides=[0, 0]))
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=get_layout,
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(
            return_value=PresentationAndPath(
                presentation_id=presentation_id,
                path="/tmp/generated/deck.pdf",
            )
        ),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ):
        response = _run(
            presentation_endpoint.generate_presentation_handler(
                request=request,
                presentation_id=presentation_id,
                async_status=None,
                sql_session=fake_async_session,
            )
        )

    assert response.path.endswith(".pdf")
    summary_slide = fake_async_session.added_all[0]
    assert summary_slide.content["title"] == "Create a Perdue QBR for Walmart vs. Target"
    assert summary_slide.content["body"] == (
        "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    )
    assert "Title:" not in summary_slide.content["body"]
    table_slide = fake_async_session.added_all[1]
    assert table_slide.layout == "layout-2"
    assert table_slide.content["tableData"]["headers"] == [
        "Retailer",
        "Visit Rate",
        "Date",
    ]
    assert table_slide.content["tableData"]["rows"] == [
        ["Target", "7.1%", "2026-05-16"]
    ]
    assert "strongest non-Walmart" not in str(summary_slide.content)
    assert "Wrong" not in str(table_slide.content)
    get_layout.assert_awaited_once_with("general")
    generate_structure.assert_awaited_once()
    get_slide_content.assert_not_awaited()


def test_generate_presentation_handler_strict_preserve_replaces_narrow_prose_layout(
    fake_async_session,
):
    locked = "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    prose_lines = [
        locked,
        "Question: Which retailer led the non-Walmart comparison?",
        "Answer: Target led by a clear margin in the supplied source facts.",
    ]
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    *prose_lines,
                ]
            )
        ],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={
            "locked_text": [locked],
            "tables_are_evidence": True,
        },
    )
    presentation_id = uuid.uuid4()
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 80},
                    },
                },
            ),
            SlideLayoutModel(
                id="wide-body",
                name="Wide Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )

    get_layout = AsyncMock(return_value=layout)
    generate_structure = AsyncMock(return_value=PresentationStructureModel(slides=[0]))
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=get_layout,
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(
            return_value=PresentationAndPath(
                presentation_id=presentation_id,
                path="/tmp/generated/deck.pdf",
            )
        ),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ):
        response = _run(
            presentation_endpoint.generate_presentation_handler(
                request=request,
                presentation_id=presentation_id,
                async_status=None,
                sql_session=fake_async_session,
            )
        )

    assert response.path.endswith(".pdf")
    presentation = fake_async_session.added[0]
    assert isinstance(presentation, PresentationModel)
    assert presentation.structure["slides"] == [1]
    slide = fake_async_session.added_all[0]
    assert slide.layout == "wide-body"
    assert slide.content["title"] == "Executive Answer"
    assert slide.content["body"] == "\n".join(prose_lines)
    assert locked in slide.content["body"]
    get_layout.assert_awaited_once_with("general")
    generate_structure.assert_awaited_once()
    get_slide_content.assert_not_awaited()


def test_strict_layout_preflight_selects_wide_layout_without_generation():
    prose_lines = [
        "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
        "Question: Which retailer led the non-Walmart comparison?",
        "Answer: Target led by a clear margin in the supplied source facts.",
    ]
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    *prose_lines,
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={"tables_are_evidence": True},
        preferred_layout_ids=[["narrow-body", "wide-body"]],
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 80},
                    },
                },
            ),
            SlideLayoutModel(
                id="wide-body",
                name="Wide Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=AsyncMock(side_effect=AssertionError("preflight must not call structure LLM")),
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        new=AsyncMock(side_effect=AssertionError("preflight must not call content LLM")),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(side_effect=AssertionError("preflight must not export")),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "pass"
    assert response.reason is None
    assert response.pinned_layout_ids == ["wide-body"]
    assert response.slides[0].selected_layout_id == "wide-body"
    assert response.slides[0].selected_layout_index == 1
    assert response.slides[0].selected_layout_name == "Wide Body"
    assert response.slides[0].compatible_layout_ids == ["wide-body"]
    assert response.slides[0].content_preview["title"] == "Executive Answer"
    assert response.slides[0].content_preview["body"] == "\n".join(prose_lines)
    assert response.layout_catalog_hash


def test_strict_layout_preflight_treats_preferred_layouts_as_candidate_set():
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Low-Exposure Strong-Handoff Retailers (continued)",
                    "",
                    "Answer: Keep this selected answer on the planned slide.",
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
        preferred_layout_ids=[["preferred-too-short"]],
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="preferred-too-short",
                name="Preferred Too Short",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "maxLength": 20,
                            "default": "Product Overview",
                        },
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
            SlideLayoutModel(
                id="nonpreferred-wide",
                name="Nonpreferred Wide",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "fail"
    assert response.reason == "strict_layout_preflight_failed"
    assert response.pinned_layout_ids == []
    assert response.issues[0]["reason"] == "unbound_visible_schema_default"
    assert response.issues[0]["expected"] == "Product Overview"
    assert response.issues[0]["details"]["field_path"] == "title"


def test_strict_layout_preflight_rejects_unbound_visible_schema_defaults():
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Which paths need attention?",
                    "Answer: The selected answer is fully supplied by Pear.",
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
        preferred_layout_ids=[["quote-slide"]],
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="quote-slide",
                name="Quote",
                json_schema={
                    "type": "object",
                    "properties": {
                        "heading": {
                            "type": "string",
                            "maxLength": 60,
                            "default": "Words of Wisdom",
                        },
                        "quote": {"type": "string", "maxLength": 200},
                        "author": {
                            "type": "string",
                            "maxLength": 50,
                            "default": "Winston Churchill",
                        },
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "fail"
    assert response.reason == "strict_layout_preflight_failed"
    assert response.pinned_layout_ids == []
    assert response.issues[0]["reason"] == "unbound_visible_schema_default"
    assert response.issues[0]["expected"] == "Winston Churchill"
    assert response.issues[0]["details"]["field_path"] == "author"


def test_strict_layout_preflight_rejects_nested_unbound_table_defaults():
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Which paths need attention?",
                    "Answer: The selected answer is fully supplied by Pear.",
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
        preferred_layout_ids=[["table-info-slide"]],
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="table-info-slide",
                name="Table With Info",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "description": {"type": "string", "maxLength": 300},
                        "tableData": {
                            "type": "object",
                            "default": {
                                "headers": ["Company", "Revenue", "Growth"],
                                "rows": [
                                    ["Company A", "$2.5M", "15%"],
                                    ["Our Company", "$1.2M", "35%"],
                                ],
                            },
                            "properties": {
                                "headers": {"type": "array", "maxItems": 5},
                                "rows": {"type": "array", "maxItems": 6},
                            },
                        },
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "fail"
    assert response.reason == "strict_layout_preflight_failed"
    assert response.pinned_layout_ids == []
    assert response.issues[0]["reason"] == "unbound_visible_schema_default"
    assert response.issues[0]["category"] == "strict_default_leakage"
    assert response.issues[0]["expected"] in {
        "Company",
        "Company A",
        "Our Company",
        "$2.5M",
        "$1.2M",
    }
    assert response.issues[0]["details"]["field_path"] == "tableData"
    assert response.issues[0]["details"]["default_kind"] == "object"


def test_strict_layout_preflight_allows_nested_table_defaults_when_table_is_bound():
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Evidence Table",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={"tables_are_evidence": True},
        preferred_layout_ids=[["table-info-slide"]],
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="table-info-slide",
                name="Table With Info",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "description": {"type": "string", "maxLength": 300},
                        "tableData": {
                            "type": "object",
                            "default": {
                                "headers": ["Company", "Revenue", "Growth"],
                                "rows": [["Company A", "$2.5M", "15%"]],
                            },
                            "properties": {
                                "headers": {"type": "array", "maxItems": 5},
                                "rows": {"type": "array", "maxItems": 6},
                            },
                        },
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "pass"
    assert response.pinned_layout_ids == ["table-info-slide"]
    assert response.slides[0].content_preview["tableData"]["headers"] == [
        "Retailer",
        "Visit Rate",
        "Date",
    ]
    assert response.warnings == []


def test_strict_layout_preflight_returns_structured_text_no_fit_issue():
    body = " ".join(["Prompt 16 preserved answer text"] * 12)
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    body,
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 150},
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "fail"
    assert response.reason == "strict_layout_preflight_failed"
    assert response.pinned_layout_ids == []
    assert len(response.issues) == 1
    issue = response.issues[0]
    assert issue["reason"] == "no_compatible_preserved_text_layout"
    assert issue["stage"] == "slide_content"
    assert issue["section_index"] == 1
    assert issue["details"]["issue_code"] == "STRICT_PRESERVE_FIT_FAILED"
    assert issue["details"]["source_path"] == "slides_markdown[0]"
    assert issue["details"]["field_path"] == "body"
    assert issue["details"]["length"] == len(body)
    assert issue["details"]["maxLength"] == 150


def test_strict_layout_preflight_pinned_incompatible_id_fails_without_replacement():
    body = " ".join(["Pinned layout must not be replaced"] * 10)
    request = presentation_endpoint.StrictLayoutPreflightRequest(
        template="general",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    body,
                ]
            )
        ],
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
        pinned_layout_ids=["narrow-body"],
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 80},
                    },
                },
            ),
            SlideLayoutModel(
                id="wide-body",
                name="Wide Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )

    with patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ):
        response = _run(presentation_endpoint.strict_layout_preflight(request))

    assert response.status == "fail"
    assert response.reason == "strict_layout_preflight_failed"
    assert response.pinned_layout_ids == []
    assert response.issues[0]["reason"] == "no_compatible_preserved_text_layout"


def test_generate_presentation_handler_uses_pinned_slide_layout_ids_without_structure_llm(
    fake_async_session,
):
    prose_lines = [
        "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
        "Question: Which retailer led the non-Walmart comparison?",
        "Answer: Target led by a clear margin in the supplied source facts.",
    ]
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    *prose_lines,
                ]
            )
        ],
        slide_layout_ids=["wide-body"],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={"tables_are_evidence": True},
    )
    presentation_id = uuid.uuid4()
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 80},
                    },
                },
            ),
            SlideLayoutModel(
                id="wide-body",
                name="Wide Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )
    generate_structure = AsyncMock(
        side_effect=AssertionError("pinned layout ids must skip structure LLM")
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(
            return_value=PresentationAndPath(
                presentation_id=presentation_id,
                path="/tmp/generated/deck.pdf",
            )
        ),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ), patch.object(
        presentation_endpoint,
        "random",
        new=Mock(randint=Mock(return_value=0)),
    ):
        response = _run(
            presentation_endpoint.generate_presentation_handler(
                request=request,
                presentation_id=presentation_id,
                async_status=None,
                sql_session=fake_async_session,
            )
        )

    assert response.path.endswith(".pdf")
    presentation = fake_async_session.added[0]
    assert presentation.structure["slides"] == [1]
    slide = fake_async_session.added_all[0]
    assert slide.layout == "wide-body"
    assert slide.content["title"] == "Executive Answer"
    assert slide.content["body"] == "\n".join(prose_lines)
    generate_structure.assert_not_awaited()
    get_slide_content.assert_not_awaited()


def test_generate_presentation_handler_accepts_pinned_layout_ids_alias(
    fake_async_session,
):
    prose_lines = [
        "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
        "Question: Which retailer led the non-Walmart comparison?",
        "Answer: Target led by a clear margin in the supplied source facts.",
    ]
    request = GeneratePresentationRequest.model_validate(
        {
            "content": "Create a contract-preserving QBR.",
            "slides_markdown": [
                "\n".join(
                    [
                        "### 1. Executive Answer",
                        "",
                        *prose_lines,
                    ]
                )
            ],
            "pinned_layout_ids": ["wide-body"],
            "language": "English",
            "export_as": "pdf",
            "template": "general",
            "contract_mode": "strict",
            "generation_mode": "layout_from_contract",
            "content_generation": "preserve",
            "generation_contract": {"tables_are_evidence": True},
        }
    )
    presentation_id = uuid.uuid4()
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 80},
                    },
                },
            ),
            SlideLayoutModel(
                id="wide-body",
                name="Wide Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )
    generate_structure = AsyncMock(
        side_effect=AssertionError("pinned layout ids must skip structure LLM")
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(
            return_value=PresentationAndPath(
                presentation_id=presentation_id,
                path="/tmp/generated/deck.pdf",
            )
        ),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ), patch.object(
        presentation_endpoint,
        "random",
        new=Mock(randint=Mock(return_value=0)),
    ):
        _run(
            presentation_endpoint.generate_presentation_handler(
                request=request,
                presentation_id=presentation_id,
                async_status=None,
                sql_session=fake_async_session,
            )
        )

    presentation = fake_async_session.added[0]
    assert request.slide_layout_ids == ["wide-body"]
    assert presentation.structure["slides"] == [1]
    assert fake_async_session.added_all[0].layout == "wide-body"
    generate_structure.assert_not_awaited()
    get_slide_content.assert_not_awaited()


def test_generate_presentation_request_rejects_conflicting_layout_pin_aliases():
    with pytest.raises(ValueError, match="pinned_layout_ids"):
        GeneratePresentationRequest.model_validate(
            {
                "content": "Create a contract-preserving QBR.",
                "slides_markdown": ["### 1. Executive Answer\n\nAnswer."],
                "slide_layout_ids": ["wide-body"],
                "pinned_layout_ids": ["narrow-body"],
                "template": "general",
                "contract_mode": "strict",
                "generation_mode": "layout_from_contract",
                "content_generation": "preserve",
            }
        )


def test_generate_presentation_handler_rejects_incompatible_pinned_layout_without_replacement(
    fake_async_session,
):
    body = " ".join(["Pinned render fit failure"] * 12)
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    body,
                ]
            )
        ],
        slide_layout_ids=["narrow-body"],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="narrow-body",
                name="Narrow Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 80},
                    },
                },
            ),
            SlideLayoutModel(
                id="wide-body",
                name="Wide Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )
    generate_structure = AsyncMock(
        side_effect=AssertionError("pinned layout ids must skip structure LLM")
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ), patch.object(
        presentation_endpoint,
        "random",
        new=Mock(randint=Mock(return_value=0)),
    ):
        with pytest.raises(HTTPException) as exc:
            _run(
                presentation_endpoint.generate_presentation_handler(
                    request=request,
                    presentation_id=uuid.uuid4(),
                    async_status=None,
                    sql_session=fake_async_session,
                )
            )

    assert exc.value.status_code == 422
    assert exc.value.detail["reason"] == "generation_contract_violation"
    assert (
        exc.value.detail["issues"][0]["reason"]
        == "no_compatible_preserved_text_layout"
    )
    assert fake_async_session.added_all == []
    generate_structure.assert_not_awaited()
    get_slide_content.assert_not_awaited()


def test_generate_presentation_handler_rejects_pinned_layout_with_unbound_default(
    fake_async_session,
):
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Which paths need attention?",
                    "Answer: The selected answer is fully supplied by Pear.",
                ]
            )
        ],
        slide_layout_ids=["quote-slide"],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="quote-slide",
                name="Quote",
                json_schema={
                    "type": "object",
                    "properties": {
                        "heading": {
                            "type": "string",
                            "maxLength": 60,
                            "default": "Words of Wisdom",
                        },
                        "quote": {"type": "string", "maxLength": 200},
                        "author": {
                            "type": "string",
                            "maxLength": 50,
                            "default": "Winston Churchill",
                        },
                    },
                },
            ),
        ],
    )
    generate_structure = AsyncMock(
        side_effect=AssertionError("pinned layout ids must skip structure LLM")
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ), patch.object(
        presentation_endpoint,
        "random",
        new=Mock(randint=Mock(return_value=0)),
    ):
        with pytest.raises(HTTPException) as exc:
            _run(
                presentation_endpoint.generate_presentation_handler(
                    request=request,
                    presentation_id=uuid.uuid4(),
                    async_status=None,
                    sql_session=fake_async_session,
                )
            )

    assert exc.value.status_code == 422
    assert exc.value.detail["reason"] == "generation_contract_violation"
    assert exc.value.detail["issues"][0]["reason"] == "unbound_visible_schema_default"
    assert exc.value.detail["issues"][0]["expected"] == "Winston Churchill"
    assert fake_async_session.added_all == []
    generate_structure.assert_not_awaited()
    get_slide_content.assert_not_awaited()


def test_generate_presentation_handler_rejects_pinned_layout_with_nested_table_default(
    fake_async_session,
):
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Which paths need attention?",
                    "Answer: The selected answer is fully supplied by Pear.",
                ]
            )
        ],
        slide_layout_ids=["table-info-slide"],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
    )
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="table-info-slide",
                name="Table With Info",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "description": {"type": "string", "maxLength": 300},
                        "tableData": {
                            "type": "object",
                            "default": {
                                "headers": ["Company", "Revenue"],
                                "rows": [["Company A", "$2.5M"]],
                            },
                            "properties": {
                                "headers": {"type": "array", "maxItems": 5},
                                "rows": {"type": "array", "maxItems": 6},
                            },
                        },
                    },
                },
            ),
        ],
    )
    generate_structure = AsyncMock(
        side_effect=AssertionError("pinned layout ids must skip structure LLM")
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=generate_structure,
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ), patch.object(
        presentation_endpoint,
        "random",
        new=Mock(randint=Mock(return_value=0)),
    ):
        with pytest.raises(HTTPException) as exc:
            _run(
                presentation_endpoint.generate_presentation_handler(
                    request=request,
                    presentation_id=uuid.uuid4(),
                    async_status=None,
                    sql_session=fake_async_session,
                )
            )

    assert exc.value.status_code == 422
    assert exc.value.detail["issues"][0]["reason"] == "unbound_visible_schema_default"
    assert exc.value.detail["issues"][0]["category"] == "strict_default_leakage"
    assert exc.value.detail["issues"][0]["details"]["field_path"] == "tableData"
    assert fake_async_session.added_all == []
    generate_structure.assert_not_awaited()
    get_slide_content.assert_not_awaited()


def test_generate_presentation_handler_skips_default_leaking_layout_when_unpinned(
    fake_async_session,
):
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Which paths need attention?",
                    "Answer: The selected answer is fully supplied by Pear.",
                ]
            )
        ],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={},
    )
    presentation_id = uuid.uuid4()
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="default-leaking",
                name="Default Leaking",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 300},
                        "tableData": {
                            "type": "object",
                            "default": {
                                "headers": ["Company", "Revenue"],
                                "rows": [["Company A", "$2.5M"]],
                            },
                            "properties": {
                                "headers": {"type": "array", "maxItems": 5},
                                "rows": {"type": "array", "maxItems": 6},
                            },
                        },
                    },
                },
            ),
            SlideLayoutModel(
                id="clean-body",
                name="Clean Body",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 80},
                        "body": {"type": "string", "maxLength": 500},
                    },
                },
            ),
        ],
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=AsyncMock(return_value=PresentationStructureModel(slides=[0])),
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint,
        "export_presentation",
        new=AsyncMock(
            return_value=PresentationAndPath(
                presentation_id=presentation_id,
                path="/tmp/generated/deck.pdf",
            )
        ),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ):
        response = _run(
            presentation_endpoint.generate_presentation_handler(
                request=request,
                presentation_id=presentation_id,
                async_status=None,
                sql_session=fake_async_session,
            )
        )

    assert response.path.endswith(".pdf")
    presentation = fake_async_session.added[0]
    assert presentation.structure["slides"] == [1]
    slide = fake_async_session.added_all[0]
    assert slide.layout == "clean-body"
    assert "tableData" not in slide.content
    get_slide_content.assert_not_awaited()


def test_generate_presentation_handler_strict_violation_returns_structured_422(
    fake_async_session,
):
    request = GeneratePresentationRequest(
        content="Create a contract-preserving QBR.",
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Evidence Table",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ],
        language="English",
        export_as="pdf",
        template="general",
        contract_mode="strict",
        generation_mode="layout_from_contract",
        content_generation="preserve",
        generation_contract={"tables_are_evidence": True},
    )
    presentation_id = uuid.uuid4()
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        slides=[
            SlideLayoutModel(
                id="layout-1",
                name="Too Narrow Table",
                json_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "tableData": {
                            "type": "object",
                            "properties": {
                                "headers": {"type": "array", "maxItems": 2},
                                "rows": {"type": "array", "maxItems": 4},
                            },
                        },
                    },
                },
            ),
        ],
    )
    get_slide_content = AsyncMock(
        side_effect=AssertionError("strict preserve must not call slide content LLM")
    )

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "get_layout_by_name",
        new=AsyncMock(return_value=layout),
    ), patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=AsyncMock(return_value=PresentationStructureModel(slides=[0])),
    ), patch.object(
        presentation_endpoint,
        "get_slide_content_from_type_and_outline",
        new=get_slide_content,
    ), patch.object(
        presentation_endpoint,
        "process_slide_and_fetch_assets",
        new=AsyncMock(return_value=[]),
    ), patch.object(
        presentation_endpoint,
        "get_images_directory",
        return_value="/tmp",
    ), patch.object(
        presentation_endpoint,
        "ImageGenerationService",
        return_value=Mock(),
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ):
        with pytest.raises(HTTPException) as exc:
            _run(
                presentation_endpoint.generate_presentation_handler(
                    request=request,
                    presentation_id=presentation_id,
                    async_status=None,
                    sql_session=fake_async_session,
                )
            )

    assert exc.value.status_code == 422
    assert exc.value.detail["reason"] == "generation_contract_violation"
    assert exc.value.detail["issues"][0]["reason"] == "no_compatible_table_layout"
    get_slide_content.assert_not_awaited()


def test_prepare_presentation_preserves_payload_icon_weight():
    presentation_id = uuid.uuid4()
    presentation = PresentationModel(
        id=presentation_id,
        content="deck",
        n_slides=1,
        language="English",
        tone="default",
        verbosity="standard",
        instructions=None,
    )
    session = FakeAsyncSession(get_results={presentation_id: presentation})
    layout = PresentationLayoutModel(
        name="swift",
        ordered=False,
        icon_weight="thin",
        slides=[
            SlideLayoutModel(
                id="swift:feature",
                name="Feature",
                description="Feature slide",
                json_schema={"title": "Feature"},
            )
        ],
    )

    with patch.object(
        presentation_endpoint,
        "generate_presentation_structure",
        new=AsyncMock(return_value=PresentationStructureModel(slides=[0])),
    ), patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generated_outlines",
        new=AsyncMock(),
    ):
        response = _run(
            presentation_endpoint.prepare_presentation(
                presentation_id=presentation_id,
                outlines=[SlideOutlineModel(content="## Causes")],
                layout=layout,
                sql_session=session,
            )
        )

    assert response.layout["icon_weight"] == "thin"
    assert response.get_layout().icon_weight == "thin"


def test_generate_presentation_sync_rejects_invalid_slide_count(fake_async_session):
    request = GeneratePresentationRequest(
        content="deck",
        n_slides=0,
        language="English",
        export_as="pdf",
        template="general",
    )

    with pytest.raises(HTTPException) as exc:
        _run(
            presentation_endpoint.generate_presentation_sync(
                request=request,
                sql_session=fake_async_session,
            )
        )

    assert exc.value.status_code == 400
    assert "Number of slides must be greater than 0" in exc.value.detail


def test_generate_presentation_handler_rejects_invalid_llm_json(fake_async_session):
    request = GeneratePresentationRequest(
        content="Generate a small deck",
        n_slides=2,
        language="English",
        export_as="pdf",
        template="general",
    )

    async def fake_outline_stream(*_args, **_kwargs):
        yield "{invalid-json"

    with patch.object(
        presentation_endpoint.MEM0_PRESENTATION_MEMORY_SERVICE,
        "store_generation_context",
        new=AsyncMock(),
    ), patch.object(
        presentation_endpoint,
        "generate_ppt_outline",
        side_effect=fake_outline_stream,
    ), patch.object(
        presentation_endpoint.CONCURRENT_SERVICE,
        "run_task",
        new=Mock(),
    ):
        with pytest.raises(HTTPException) as exc:
            _run(
                presentation_endpoint.generate_presentation_handler(
                    request=request,
                    presentation_id=uuid.uuid4(),
                    async_status=None,
                    sql_session=fake_async_session,
                )
            )

    assert exc.value.status_code == 400
    assert "Failed to generate presentation outlines" in exc.value.detail
