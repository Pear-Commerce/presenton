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
