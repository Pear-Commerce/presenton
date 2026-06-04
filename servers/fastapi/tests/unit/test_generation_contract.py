from fastapi import HTTPException

from models.generate_presentation_request import GeneratePresentationRequest
from models.api_error_model import APIErrorModel
from utils.generation_contract import (
    build_generation_contract_state,
    contract_table_issues_for_schema,
    enforce_contract_or_raise,
    overlay_contract_tables,
    parse_markdown_tables,
    schema_with_contract_table_overrides,
    validate_contract_request,
    validate_slide_json_contract,
    validate_structure,
)
from utils.schema_utils import get_schema_validation_errors


def strict_request(**overrides):
    payload = {
        "content": "Create a QBR from the supplied sections.",
        "slides_markdown": [
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ],
        "contract_mode": "strict",
        "generation_mode": "layout_from_contract",
        "content_generation": "preserve",
        "generation_contract": {
            "locked_text": [
                "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
            ],
            "forbidden_additions": ["checkout optimization"],
            "tables_are_evidence": True,
        },
    }
    payload.update(overrides)
    return GeneratePresentationRequest.model_validate(payload)


def test_strict_contract_request_accepts_new_api_fields():
    request = strict_request()
    state = build_generation_contract_state(request)

    assert state.enabled
    assert state.violation_policy == "fail"
    assert len(state.sections) == 1
    assert state.sections[0].title == "Executive Answer"
    assert state.evidence_tables[0].headers == ["Retailer", "Visit Rate", "Date"]


def test_strict_contract_dedupes_same_slide_table_from_contract_and_markdown():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
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
        generation_contract={
            "locked_text": [
                "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
            ],
            "evidence_tables": [
                {
                    "slide_index": 2,
                    "headers": ["Retailer", "Visit Rate", "Date"],
                    "rows": [["Target", "7.1%", "2026-05-16"]],
                }
            ],
            "tables_are_evidence": True,
        },
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 5},
                    "rows": {"type": "array", "maxItems": 6},
                },
            },
        },
    }

    assert [
        (table.slide_index, table.section_title, table.headers, table.rows)
        for table in state.evidence_tables
    ] == [
        (
            2,
            None,
            ["Retailer", "Visit Rate", "Date"],
            [["Target", "7.1%", "2026-05-16"]],
        )
    ]
    assert contract_table_issues_for_schema(schema, state, 1) == []


def test_strict_contract_rejects_missing_locked_source_text():
    request = strict_request(
        generation_contract={
            "locked_text": ["This sentence is not in the supplied source."],
        }
    )
    state = build_generation_contract_state(request)

    issues = validate_contract_request(state)

    assert issues[0].reason == "missing_locked_text"


def test_markdown_table_parser_preserves_escaped_pipe_cells():
    tables = parse_markdown_tables(
        "\n".join(
            [
                "| DTC Link | Page Loads |",
                "| --- | --- |",
                "| Target Fuego MP \\| Target | 2,040 |",
            ]
        )
    )

    assert tables[0].rows == [["Target Fuego MP | Target", "2,040"]]


def test_strict_contract_rejects_changed_slide_count():
    state = build_generation_contract_state(strict_request())

    issues = validate_structure(state, 2, stage="structure")

    assert issues[0].reason == "extra_slide"


def test_strict_contract_reports_skipped_sections():
    request = strict_request(
        slides_markdown=[
            "### 1. Executive Answer\n\nOne",
            "### 2. Evidence Table\n\nTwo",
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)

    issues = validate_structure(state, 1, stage="structure")

    assert issues[0].reason == "skipped_section"


def test_contract_tables_overlay_into_compatible_table_schema():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }
    generated = {
        "title": "Executive Answer",
        "tableData": {
            "headers": ["Changed", "Value"],
            "rows": [["Wrong", "1%"]],
        },
    }

    content, issues = overlay_contract_tables(generated, schema, state, 0)

    assert issues == []
    assert content["tableData"]["headers"] == ["Retailer", "Visit Rate", "Date"]
    assert content["tableData"]["rows"] == [["Target", "7.1%", "2026-05-16"]]


def test_strict_contract_relaxes_table_minimums_for_exact_evidence():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "minItems": 4, "maxItems": 4},
                    "rows": {
                        "type": "array",
                        "minItems": 2,
                        "maxItems": 4,
                        "items": {
                            "type": "array",
                            "minItems": 4,
                            "maxItems": 4,
                            "items": {"type": "string"},
                        },
                    },
                },
            },
        },
    }

    relaxed = schema_with_contract_table_overrides(schema, state, 0)
    table_schema = relaxed["properties"]["tableData"]["properties"]

    assert schema["properties"]["tableData"]["properties"]["rows"]["minItems"] == 2
    assert table_schema["headers"]["minItems"] == 3
    assert table_schema["headers"]["maxItems"] == 4
    assert table_schema["rows"]["minItems"] == 1
    assert table_schema["rows"]["maxItems"] == 4
    assert table_schema["rows"]["items"]["minItems"] == 3
    assert table_schema["rows"]["items"]["maxItems"] == 4
    assert get_schema_validation_errors(
        relaxed,
        {
            "title": "Evidence Table",
            "tableData": {
                "headers": ["Retailer", "Visit Rate", "Date"],
                "rows": [["Target", "7.1%", "2026-05-16"]],
            },
        },
    ) == []


def test_strict_contract_keeps_table_maximums_as_layout_blockers():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 2},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }

    content, issues = overlay_contract_tables({}, schema, state, 0)

    assert content == {}
    assert issues[0].reason == "no_compatible_table_layout"
    assert issues[0].expected == {"columns": 3, "rows": 1}


def test_strict_contract_detects_forbidden_addition_and_missing_exact_terms():
    state = build_generation_contract_state(strict_request())
    slide_json = [
        {
            "title": "Executive Answer",
            "body": "checkout optimization is next.",
            "tableData": {
                "headers": ["Retailer", "Visit Rate", "Date"],
                "rows": [["Target", "7.1%", "2026-05-16"]],
            },
        }
    ]

    issues = validate_slide_json_contract(state, slide_json)
    reasons = {issue.reason for issue in issues}

    assert "forbidden_addition" in reasons
    assert "missing_locked_text" in reasons


def test_strict_contract_fail_policy_raises_structured_diagnostics():
    state = build_generation_contract_state(strict_request())
    issues = validate_structure(state, 2, stage="structure")

    try:
        enforce_contract_or_raise(state, issues, stage="structure")
    except HTTPException as exc:
        assert exc.status_code == 422
        assert exc.detail["reason"] == "generation_contract_violation"
        assert exc.detail["issues"][0]["reason"] == "extra_slide"
    else:
        raise AssertionError("Expected strict contract violation to fail")


def test_api_error_model_accepts_structured_http_exception_detail():
    exc = HTTPException(
        status_code=422,
        detail={
            "reason": "generation_contract_violation",
            "issues": [{"reason": "changed_table_values"}],
        },
    )

    model = APIErrorModel.from_exception(exc)

    assert model.status_code == 422
    assert model.detail["reason"] == "generation_contract_violation"
    assert model.model_dump(mode="json")["detail"]["issues"][0]["reason"] == (
        "changed_table_values"
    )
