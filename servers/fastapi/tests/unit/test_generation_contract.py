import copy

from fastapi import HTTPException

from utils import generation_contract as generation_contract_module
from models.generate_presentation_request import GeneratePresentationRequest
from models.api_error_model import APIErrorModel
from utils.generation_contract import (
    ContractIssue,
    ContractTable,
    build_preserved_slide_content,
    build_generation_contract_state,
    contract_layout_issues_for_schema,
    contract_table_issues_for_schema,
    contract_text_issues_for_schema,
    enforce_contract_or_raise,
    overlay_contract_text,
    overlay_contract_tables,
    parse_markdown_tables,
    schema_with_contract_table_overrides,
    validate_contract_request,
    validate_pptx_contract,
    validate_slide_json_contract,
    validate_structure,
    visible_text_from_json,
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
    assert state.evidence_tables[0].binding_kind == "markdown_source"
    assert state.evidence_tables[0].hard_table_binding is True


def test_explicit_required_table_rendered_as_prose_is_error():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Retailer Target Visit Rate 7.1% Date 2026-05-16.",
                ]
            )
        ],
        generation_contract={
            "locked_text": [],
            "evidence_tables": [
                {
                    "slide_index": 1,
                    "headers": ["Retailer", "Visit Rate", "Date"],
                    "rows": [["Target", "7.1%", "2026-05-16"]],
                    "required": True,
                }
            ],
            "tables_are_evidence": False,
        },
    )
    state = build_generation_contract_state(request)

    issues = validate_slide_json_contract(
        state,
        [
            {
                "title": "Executive Answer",
                "body": "Retailer Target Visit Rate 7.1% Date 2026-05-16.",
            }
        ],
    )
    table_issue = next(issue for issue in issues if issue.reason == "table_rendered_as_prose")

    assert table_issue.severity == "error"
    assert table_issue.category == "strict_table_shape"
    assert table_issue.details["binding_kind"] == "explicit_contract"
    assert table_issue.details["required_table_binding"] is True


def test_optional_markdown_table_rendered_as_prose_is_warning_only():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ],
        generation_contract={
            "locked_text": [],
            "tables_are_evidence": False,
        },
    )
    state = build_generation_contract_state(request)

    issues = validate_slide_json_contract(
        state,
        [
            {
                "title": "Executive Answer",
                "body": "Retailer Visit Rate Date Target 7.1% 2026-05-16",
            }
        ],
    )
    table_issue = next(issue for issue in issues if issue.reason == "table_rendered_as_prose")

    assert table_issue.severity == "warning"
    assert table_issue.details["binding_kind"] == "markdown_source"
    assert table_issue.details["required_table_binding"] is False


def test_pipe_like_prose_without_markdown_table_has_no_table_shape_issue():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Walmart | Target | who led?",
                    "Answer: Target led the supplied comparison.",
                ]
            )
        ],
        generation_contract={"locked_text": [], "tables_are_evidence": False},
    )
    state = build_generation_contract_state(request)

    issues = validate_slide_json_contract(
        state,
        [
            {
                "title": "Executive Answer",
                "body": "Question: Walmart | Target | who led?\nAnswer: Target led the supplied comparison.",
            }
        ],
    )

    assert all(
        issue.reason not in {"table_rendered_as_prose", "changed_table_values"}
        for issue in issues
    )


def test_optional_markdown_table_with_dropped_values_is_error():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ],
        generation_contract={"locked_text": [], "tables_are_evidence": False},
    )
    state = build_generation_contract_state(request)

    issues = validate_slide_json_contract(
        state,
        [{"title": "Executive Answer", "body": "Target had a 7.1% visit rate."}],
    )
    table_issue = next(issue for issue in issues if issue.reason == "changed_table_values")

    assert table_issue.severity == "error"
    assert table_issue.details["required_table_binding"] is False


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


def test_strict_contract_does_not_promote_prose_only_iso_dates():
    selected_period = "Selected period: February 15 - May 16, 2026"
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: What changed between 2026-02-15 and 2026-05-16?",
                    selected_period,
                    "Visit rate improved to 7.1%.",
                ]
            )
        ],
        generation_contract={
            "locked_text": [],
            "forbidden_additions": [],
            "tables_are_evidence": False,
        },
    )
    state = build_generation_contract_state(request)

    assert "2026-02-15" not in state.exact_terms
    assert "2026-05-16" not in state.exact_terms
    assert selected_period in state.exact_terms

    issues = validate_slide_json_contract(
        state,
        [
            {
                "title": "Executive Answer",
                "caption": selected_period,
                "body": "Visit rate improved to 7.1%.",
            }
        ],
    )

    assert issues == []


def test_strict_contract_normalizes_date_caption_wrappers():
    markdown_caption = (
        "Date caption: Selected: Feb 15-May 16, 2026 | "
        "Prior: Nov 16, 2025-Feb 14, 2026. Keep this near the footer."
    )
    clean_caption = (
        "Selected: Feb 15-May 16, 2026 | "
        "Prior: Nov 16, 2025-Feb 14, 2026"
    )
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    markdown_caption,
                ]
            )
        ],
        generation_contract={
            "locked_text": [],
            "forbidden_additions": [],
            "tables_are_evidence": False,
        },
    )
    state = build_generation_contract_state(request)

    assert clean_caption in state.exact_terms
    assert all("Date caption" not in term for term in state.exact_terms)
    assert all("Keep this near" not in term for term in state.exact_terms)


def test_strict_contract_rejects_missing_locked_source_text():
    request = strict_request(
        generation_contract={
            "locked_text": ["This sentence is not in the supplied source."],
        }
    )
    state = build_generation_contract_state(request)

    issues = validate_contract_request(state)

    assert issues[0].reason == "missing_locked_text"


def test_locked_text_inside_html_comment_is_not_matched_or_emitted():
    hidden_locked = "Locked claim: This sentence exists only inside a hidden renderer comment."
    visible_body = "Visible claim: Target led the supplied comparison."
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "<!--",
                    hidden_locked,
                    "-->",
                    visible_body,
                ]
            )
        ],
        generation_contract={
            "locked_text": [hidden_locked],
            "tables_are_evidence": False,
        },
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    validation_issues = validate_contract_request(state)
    content, build_issues = build_preserved_slide_content(schema, state, 0)
    overlaid, overlay_issues = overlay_contract_text({}, schema, state, 0)

    assert [issue.reason for issue in validation_issues] == ["missing_locked_text"]
    assert build_issues == []
    assert content["body"] == visible_body
    assert hidden_locked not in visible_text_from_json(content)
    assert overlaid == {}
    assert overlay_issues == []


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


def test_markdown_table_parser_ignores_html_comment_blocks_for_overlay():
    markdown = "\n".join(
        [
            "### 1. Evidence",
            "",
            "| Retailer | Visit Rate |",
            "| --- | --- |",
            "| Target | 7.1% |",
            "",
            "<!-- | Hidden Retailer | Hidden Metric |",
            "| --- | --- |",
            "| Do Not Show | 99% | -->",
            "<!-- stale metadata: | Rejected Layout | 0 | -->",
            "",
            "| Source | Date |",
            "| --- | --- |",
            "| Census | 2026-05-16 |",
        ]
    )

    tables = parse_markdown_tables(markdown)

    assert [(table.headers, table.rows) for table in tables] == [
        (["Retailer", "Visit Rate"], [["Target", "7.1%"]]),
        (["Source", "Date"], [["Census", "2026-05-16"]]),
    ]

    state = build_generation_contract_state(
        strict_request(
            slides_markdown=[markdown],
            generation_contract={"locked_text": [], "tables_are_evidence": True},
        )
    )
    schema = {
        "type": "object",
        "properties": {
            "primaryTable": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 3},
                    "rows": {"type": "array", "maxItems": 3},
                },
            },
            "sourceTable": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 3},
                    "rows": {"type": "array", "maxItems": 3},
                },
            },
        },
    }

    content, issues = overlay_contract_tables({}, schema, state, 0)

    assert issues == []
    assert content["primaryTable"]["rows"] == [["Target", "7.1%"]]
    assert content["sourceTable"]["rows"] == [["Census", "2026-05-16"]]
    assert "Do Not Show" not in str(content)
    assert "Rejected Layout" not in str(content)


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


def test_contract_text_overlay_replaces_paraphrased_visible_body():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 40},
            "body": {"type": "string", "maxLength": 200},
            "__speaker_note__": {"type": "string", "maxLength": 500},
        },
    }
    generated = {
        "title": "Executive Answer",
        "body": "Target had the leading non-Walmart rate in mid-May.",
        "__speaker_note__": "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
    }

    content, issues = overlay_contract_text(generated, schema, state, 0)

    assert issues == []
    assert (
        content["body"]
        == "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    )
    assert "2026-05-16" in visible_text_from_json(content)


def test_contract_text_overlay_does_not_use_hidden_or_media_fields():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "__speaker_note__": {"type": "string", "maxLength": 500},
            "image": {
                "type": "object",
                "properties": {
                    "__image_prompt__": {"type": "string", "maxLength": 500},
                },
            },
        },
    }

    content, issues = overlay_contract_text({}, schema, state, 0)

    assert content == {}
    assert issues[0].reason == "no_compatible_locked_text_layout"


def test_contract_text_overlay_rejects_too_short_layout_field():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 20},
        },
    }

    assert contract_text_issues_for_schema(schema, state, 0)[0].reason == (
        "no_compatible_locked_text_layout"
    )


def test_contract_layout_issues_preflights_preserved_markdown_body_fit():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Which retailer led the non-Walmart comparison?",
                    "Answer: Target led by a clear margin in the supplied source facts.",
                    "Evidence note: This prose must remain visible as authored.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    expected_body = "\n".join(
        [
            "Question: Which retailer led the non-Walmart comparison?",
            "Answer: Target led by a clear margin in the supplied source facts.",
            "Evidence note: This prose must remain visible as authored.",
        ]
    )
    narrow_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 50},
        },
    }
    wide_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    narrow_issues = contract_layout_issues_for_schema(
        narrow_schema,
        state,
        0,
        preserve_markdown=True,
    )

    assert [issue.reason for issue in narrow_issues] == [
        "no_compatible_preserved_text_layout"
    ]
    assert narrow_issues[0].expected == expected_body
    assert narrow_issues[0].details["issue_code"] == "STRICT_PRESERVE_FIT_FAILED"
    assert narrow_issues[0].details["content_kind"] == "preserved_markdown_body"
    assert narrow_issues[0].details["source_path"] == "slides_markdown[0]"
    assert narrow_issues[0].details["field_path"] == "body"
    assert narrow_issues[0].details["length"] == len(expected_body)
    assert narrow_issues[0].details["maxLength"] == 50
    assert narrow_issues[0].details["slide_index"] == 0
    assert narrow_issues[0].details["section_index"] == 1
    assert narrow_issues[0].to_dict()["details"]["issue_code"] == (
        "STRICT_PRESERVE_FIT_FAILED"
    )
    assert (
        contract_layout_issues_for_schema(
            wide_schema,
            state,
            0,
            preserve_markdown=True,
        )
        == []
    )


def test_contract_layout_issues_reports_locked_text_blocker():
    locked = "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    locked,
                ]
            )
        ],
        generation_contract={"locked_text": [locked]},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 20},
        },
    }

    issues = contract_layout_issues_for_schema(schema, state, 0)

    assert [issue.reason for issue in issues] == ["no_compatible_locked_text_layout"]


def test_contract_layout_issues_reports_table_blocker():
    request = strict_request(
        generation_contract={
            "locked_text": [],
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
                    "headers": {"type": "array", "maxItems": 2},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }

    issues = contract_layout_issues_for_schema(schema, state, 0)

    assert [issue.reason for issue in issues] == ["no_compatible_table_layout"]


def test_build_preserved_slide_content_copies_title_text_and_table():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "headline": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 200},
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["headline"] == "Executive Answer"
    assert content["body"] == (
        "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    )
    assert content["tableData"]["headers"] == ["Retailer", "Visit Rate", "Date"]
    assert content["tableData"]["rows"] == [["Target", "7.1%", "2026-05-16"]]


def test_build_preserved_slide_content_maps_labeled_summary_to_bullets():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Summary",
                    "",
                    "Title: Executive Summary",
                    "Question: What should Perdue take away from retailer handoff evidence in this QBR?",
                    "Date range: Feb 15-May 16, 2026.",
                    "Answer: Walmart leads visits at 2.3% RVR; ShopRite is the watchout at 0.3%.",
                    "What follows: experience rates, visit leaders, and Walmart's +470 visit movement.",
                    "Definition: RVR = retailer visit rate; retailer visits divided by page loads.",
                ]
            )
        ],
        generation_contract={"locked_text": [], "tables_are_evidence": False},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 40},
            "description": {
                "type": "string",
                "maxLength": 150,
                "default": "Default text must not leak into strict output.",
            },
            "bulletPoints": {
                "type": "array",
                "minItems": 1,
                "maxItems": 3,
                "default": [
                    {
                        "title": "Default",
                        "description": "Default bullet text must not leak.",
                    }
                ],
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "maxLength": 60},
                        "description": {"type": "string", "maxLength": 100},
                        "icon": {
                            "type": "object",
                            "properties": {
                                "__icon_url__": {"type": "string", "maxLength": 500},
                                "__icon_query__": {"type": "string", "maxLength": 20},
                            },
                        },
                    },
                },
            },
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)
    layout_issues = contract_layout_issues_for_schema(
        schema,
        state,
        0,
        preserve_markdown=True,
    )

    assert issues == []
    assert layout_issues == []
    assert content["title"] == "Executive Summary"
    assert content["description"] == (
        "Date range: Feb 15-May 16, 2026. Definition: RVR = retailer visit rate; "
        "retailer visits divided by page loads."
    )
    assert [item["title"] for item in content["bulletPoints"]] == [
        "Question",
        "Answer",
        "What follows",
    ]
    assert content["bulletPoints"][0]["description"].startswith(
        "What should Perdue take away"
    )
    assert content["bulletPoints"][1]["description"] == (
        "Walmart leads visits at 2.3% RVR; ShopRite is the watchout at 0.3%."
    )
    assert "icon" in content["bulletPoints"][2]


def test_build_preserved_slide_content_rejects_nested_unbound_table_defaults():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Answer: The selected answer is fully supplied by Pear.",
                ]
            )
        ],
        generation_contract={"locked_text": [], "tables_are_evidence": False},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
            "tableData": {
                "type": "object",
                "default": {
                    "headers": ["Company", "Revenue"],
                    "rows": [["Company A", "$2.5M"], ["Our Company", "$1.2M"]],
                },
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)
    default_issue = next(
        issue for issue in issues if issue.reason == "unbound_visible_schema_default"
    )

    assert content["title"] == "Executive Answer"
    assert default_issue.category == "strict_default_leakage"
    assert default_issue.expected in {"Company", "Company A", "Our Company", "$2.5M", "$1.2M"}
    assert default_issue.details["issue_code"] == "STRICT_LAYOUT_VISIBLE_DEFAULT_UNBOUND"
    assert default_issue.details["field_path"] == "tableData"
    assert default_issue.details["default_path"].startswith("tableData.")
    assert default_issue.details["default_kind"] == "object"


def test_bound_table_data_suppresses_nested_default_leakage():
    request = strict_request(
        generation_contract={
            "locked_text": [],
            "evidence_tables": [
                {
                    "slide_index": 1,
                    "headers": ["Retailer", "Visit Rate", "Date"],
                    "rows": [["Target", "7.1%", "2026-05-16"]],
                }
            ],
            "tables_are_evidence": True,
        }
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
            "tableData": {
                "type": "object",
                "default": {
                    "headers": ["Company", "Revenue"],
                    "rows": [["Company A", "$2.5M"], ["Our Company", "$1.2M"]],
                },
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["tableData"]["headers"] == ["Retailer", "Visit Rate", "Date"]
    assert content["tableData"]["rows"] == [["Target", "7.1%", "2026-05-16"]]


def test_build_preserved_slide_content_keeps_prose_between_locked_blocks():
    locked_a = "Locked A: Target led the supplied comparison."
    visible_prose = "Visible prose between locked lines must remain visible."
    locked_b = "Locked B: The reporting date was 2026-05-16."
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    locked_a,
                    visible_prose,
                    locked_b,
                ]
            )
        ],
        generation_contract={
            "locked_text": [locked_a, locked_b],
            "tables_are_evidence": False,
        },
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }
    expected_body = "\n".join([locked_a, visible_prose, locked_b])

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["body"] == expected_body
    assert visible_prose in visible_text_from_json(content)


def test_build_preserved_slide_content_preserves_pipe_delimited_prose():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Question: Walmart | Target | who led?",
                    "Non-table comparison: Walmart | Target | Perdue QBR source facts.",
                    "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ]
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 500},
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {"type": "array", "maxItems": 4},
                },
            },
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["body"] == "\n".join(
        [
            "Question: Walmart | Target | who led?",
            "Non-table comparison: Walmart | Target | Perdue QBR source facts.",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
        ]
    )
    assert "Retailer | Visit Rate | Date" not in content["body"]
    assert content["tableData"]["headers"] == ["Retailer", "Visit Rate", "Date"]
    assert content["tableData"]["rows"] == [["Target", "7.1%", "2026-05-16"]]


def test_build_preserved_slide_content_keeps_optional_markdown_table_in_body_without_table_slot():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Answer: Target led the supplied comparison.",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% | 2026-05-16 |",
                ]
            )
        ],
        generation_contract={"locked_text": [], "tables_are_evidence": False},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 500},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert "Answer: Target led the supplied comparison." in content["body"]
    assert "| Retailer | Visit Rate | Date |" in content["body"]
    assert "| Target | 7.1% | 2026-05-16 |" in content["body"]


def test_build_preserved_slide_content_preserves_body_subheadings():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "#### Key Takeaways",
                    "Target led the non-Walmart comparison in the supplied facts.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["title"] == "Executive Answer"
    assert content["body"] == "\n".join(
        [
            "Key Takeaways",
            "Target led the non-Walmart comparison in the supplied facts.",
        ]
    )
    assert "#### Key Takeaways" not in content["body"]


def test_build_preserved_slide_content_skips_multiline_html_comments():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "<!--",
                    "Renderer instructions: use a different layout.",
                    "Do not show this instruction.",
                    "-->",
                    "Visible claim: Target led the supplied comparison.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["body"] == "Visible claim: Target led the supplied comparison."
    assert "Renderer instructions" not in visible_text_from_json(content)
    assert "-->" not in visible_text_from_json(content)


def test_build_preserved_slide_content_skips_one_line_html_comments():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "<!-- renderer: hide me -->",
                    "Visible prose: Target led the supplied comparison.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["body"] == "Visible prose: Target led the supplied comparison."
    assert "renderer: hide me" not in visible_text_from_json(content)


def test_build_preserved_slide_content_ignores_hidden_comment_heading():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "<!--",
                    "### Hidden Renderer Heading",
                    "-->",
                    "### 1. Visible Heading",
                    "",
                    "Visible claim: Target led the supplied comparison.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert state.sections[0].title == "Visible Heading"
    assert content["title"] == "Visible Heading"
    assert content["body"] == "Visible claim: Target led the supplied comparison."
    assert "Hidden Renderer Heading" not in visible_text_from_json(content)


def test_build_preserved_slide_content_strips_inline_html_comments():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Visible before <!-- hidden instruction --> visible after.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 300},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["body"] == "Visible before visible after."
    assert "hidden instruction" not in visible_text_from_json(content)
    assert "<!--" not in visible_text_from_json(content)


def test_build_preserved_slide_content_prefers_pear_title_and_subtitle_lines():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Cover",
                    "Title: Create a Perdue QBR for Walmart vs. Target",
                    "Subtitle: Feb 15-May 16, 2026",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "subtitle": {"type": "string", "maxLength": 40},
            "body": {"type": "string", "maxLength": 200},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content == {
        "title": "Create a Perdue QBR for Walmart vs. Target",
        "subtitle": "Feb 15-May 16, 2026",
    }
    assert "Title:" not in visible_text_from_json(content)


def test_build_preserved_slide_content_keeps_subtitle_line_when_unmapped():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Cover",
                    "Title: Create a Perdue QBR for Walmart vs. Target",
                    "Subtitle: Feb 15-May 16, 2026",
                    "Question: What changed?",
                    "Selected period: February 15 - May 16, 2026",
                    "Answer: Target gained share.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 200},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["title"] == "Create a Perdue QBR for Walmart vs. Target"
    assert content["body"] == "\n".join(
        [
            "Subtitle: Feb 15-May 16, 2026",
            "Question: What changed?",
            "Selected period: February 15 - May 16, 2026",
            "Answer: Target gained share.",
        ]
    )
    assert "Title:" not in content["body"]


def test_build_preserved_slide_content_does_not_emit_hidden_media_or_icon_fields():
    locked = "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    locked,
                ]
            )
        ],
        generation_contract={"locked_text": [locked]},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "content": {"type": "string", "maxLength": 200},
            "__speaker_note__": {"type": "string", "maxLength": 500},
            "__image_prompt__": {"type": "string", "maxLength": 500},
            "__image_url__": {"type": "string", "maxLength": 500},
            "__icon_query__": {"type": "string", "maxLength": 500},
            "__icon_url__": {"type": "string", "maxLength": 500},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["title"] == "Executive Answer"
    assert content["content"] == (
        "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16."
    )
    forbidden_keys = {
        "__speaker_note__",
        "__image_prompt__",
        "__image_url__",
        "__icon_query__",
        "__icon_url__",
    }
    assert forbidden_keys.isdisjoint(content)


def test_build_preserved_slide_content_returns_issue_instead_of_truncating():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "This exact sentence is too long for the selected visible body field.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 80},
            "body": {"type": "string", "maxLength": 12},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert content == {"title": "Executive Answer"}
    assert issues[0].reason == "no_compatible_preserved_text_layout"
    assert issues[0].expected == (
        "This exact sentence is too long for the selected visible body field."
    )


def test_build_preserved_slide_content_maps_heading_to_body_without_title_field():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Executive Answer",
                    "",
                    "Answer: Target gained share.",
                ]
            )
        ],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "body": {"type": "string", "maxLength": 120},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert issues == []
    assert content["body"] == "\n".join(
        [
            "Executive Answer",
            "Answer: Target gained share.",
        ]
    )
    assert "Executive Answer" in visible_text_from_json(content)


def test_build_preserved_slide_content_reports_heading_when_no_text_field_fits():
    request = strict_request(
        slides_markdown=["### 1. Executive Answer"],
        generation_contract={"locked_text": []},
    )
    state = build_generation_contract_state(request)
    schema = {
        "type": "object",
        "properties": {
            "body": {"type": "string", "maxLength": 8},
        },
    }

    content, issues = build_preserved_slide_content(schema, state, 0)

    assert content == {}
    assert [issue.reason for issue in issues] == ["no_compatible_title_layout"]
    assert issues[0].expected == "Executive Answer"
    assert issues[0].details["issue_code"] == "STRICT_PRESERVE_FIT_FAILED"
    assert issues[0].details["content_kind"] == "preserved_markdown_title"
    assert issues[0].details["source_path"] == "slides_markdown[0]"
    assert issues[0].details["field_path"] == "body"
    assert issues[0].details["length"] == len("Executive Answer")
    assert issues[0].details["maxLength"] == 8


def test_validate_slide_json_contract_requires_visible_locked_text():
    state = build_generation_contract_state(strict_request())
    slide_json = [
        {
            "title": "Executive Answer",
            "__speaker_note__": "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "image": {
                "__image_prompt__": "Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            },
            "tableData": {
                "headers": ["Retailer", "Visit Rate", "Date"],
                "rows": [["Target", "7.1%", "2026-05-16"]],
            },
        }
    ]

    reasons = {issue.reason for issue in validate_slide_json_contract(state, slide_json)}

    assert "missing_locked_text" in reasons
    assert "changed_metric_date_or_label" not in reasons
    assert "changed_table_values" not in reasons


def test_validate_slide_json_contract_rejects_generic_placeholders():
    state = build_generation_contract_state(strict_request())
    slide_json = [
        {
            "title": "Executive Answer",
            "body": "\n".join(
                [
                    "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
                    "Retailer X outpaced Retailer Alpha in Campaign A from Source Beta.",
                ]
            ),
            "tableData": {
                "headers": ["Retailer", "Visit Rate", "Date"],
                "rows": [["Target", "7.1%", "2026-05-16"]],
            },
        }
    ]

    issues = validate_slide_json_contract(state, slide_json)
    placeholder_issue = next(
        issue for issue in issues if issue.reason == "generic_placeholder_content"
    )

    assert placeholder_issue.stage == "slide_content"
    assert placeholder_issue.actual == [
        "Retailer X",
        "Retailer Alpha",
        "Campaign A",
        "Source Beta",
    ]


def test_strict_contract_accepts_concrete_retailer_campaign_source_terms(monkeypatch):
    state = build_generation_contract_state(strict_request())
    body = "\n".join(
        [
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "Target, Kroger, and Whole Foods were reviewed using the Spring Savings campaign and Numerator panel source.",
        ]
    )
    slide_json = [
        {
            "title": "Executive Answer",
            "body": body,
            "tableData": {
                "headers": ["Retailer", "Visit Rate", "Date"],
                "rows": [["Target", "7.1%", "2026-05-16"]],
            },
        }
    ]
    text = "\n".join(
        [
            "Executive Answer",
            body,
            "Retailer",
            "Visit Rate",
            "Date",
            "Target",
            "7.1%",
            "2026-05-16",
        ]
    )

    table = ContractTable(
        headers=["Retailer", "Visit Rate", "Date"],
        rows=[["Target", "7.1%", "2026-05-16"]],
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, [table]),
    )

    assert validate_slide_json_contract(state, slide_json) == []
    assert validate_pptx_contract(state, "/tmp/deck.pptx") == []


def test_validate_pptx_contract_accepts_required_table_values_exported_as_text(monkeypatch):
    state = build_generation_contract_state(strict_request())
    text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "Retailer",
            "Visit Rate",
            "Date",
            "Target",
            "7.1%",
            "2026-05-16",
        ]
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, []),
    )

    assert validate_pptx_contract(state, "/tmp/deck.pptx") == []


def test_validate_pptx_contract_rejects_missing_table_export_values(monkeypatch):
    state = build_generation_contract_state(strict_request())
    text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "Retailer",
            "Visit Rate",
            "Target",
            "7.1%",
            "2026-05-16",
        ]
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, []),
    )

    issues = validate_pptx_contract(state, "/tmp/deck.pptx")
    table_issue = next(issue for issue in issues if issue.reason == "changed_table_values")

    assert table_issue.stage == "pptx_export"
    assert table_issue.expected == {
        "headers": ["Retailer", "Visit Rate", "Date"],
        "rows": [["Target", "7.1%", "2026-05-16"]],
    }


def test_validate_pptx_contract_does_not_satisfy_table_from_prose_sentence(monkeypatch):
    state = build_generation_contract_state(strict_request())
    text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "Retailer Visit Rate Date Target 7.1% 2026-05-16 appears in one sentence.",
        ]
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, [], {1: text}),
    )

    issues = validate_pptx_contract(state, "/tmp/deck.pptx")

    assert any(issue.reason == "changed_table_values" for issue in issues)


def test_validate_pptx_contract_does_not_satisfy_table_from_wrong_slide(monkeypatch):
    state = build_generation_contract_state(strict_request())
    slide_one_text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
        ]
    )
    slide_two_text = "\n".join(
        [
            "Retailer",
            "Visit Rate",
            "Date",
            "Target",
            "7.1%",
            "2026-05-16",
        ]
    )
    text = "\n".join([slide_one_text, slide_two_text])

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, [], {1: slide_one_text, 2: slide_two_text}),
    )

    issues = validate_pptx_contract(state, "/tmp/deck.pptx")

    assert any(issue.reason == "changed_table_values" for issue in issues)


def test_validate_pptx_contract_does_not_fallback_from_empty_expected_slide(monkeypatch):
    state = build_generation_contract_state(strict_request())
    slide_two_text = "\n".join(
        [
            "Retailer",
            "Visit Rate",
            "Date",
            "Target",
            "7.1%",
            "2026-05-16",
        ]
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (slide_two_text, [], {1: "", 2: slide_two_text}),
    )

    issues = validate_pptx_contract(state, "/tmp/deck.pptx")

    assert any(issue.reason == "changed_table_values" for issue in issues)


def test_validate_pptx_contract_does_not_satisfy_native_table_from_wrong_slide(monkeypatch):
    state = build_generation_contract_state(strict_request())
    text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
        ]
    )
    table = ContractTable(
        headers=["Retailer", "Visit Rate", "Date"],
        rows=[["Target", "7.1%", "2026-05-16"]],
        slide_index=2,
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, [table], {1: text, 2: ""}),
    )

    issues = validate_pptx_contract(state, "/tmp/deck.pptx")

    assert any(issue.reason == "changed_table_values" for issue in issues)


def test_validate_pptx_contract_accepts_matching_table_export(monkeypatch):
    state = build_generation_contract_state(strict_request())
    text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "Retailer",
            "Visit Rate",
            "Date",
            "Target",
            "7.1%",
            "2026-05-16",
        ]
    )
    table = ContractTable(
        headers=["Retailer", "Visit Rate", "Date"],
        rows=[["Target", "7.1%", "2026-05-16"]],
        slide_index=1,
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, [table]),
    )

    assert validate_pptx_contract(state, "/tmp/deck.pptx") == []


def test_validate_pptx_contract_rejects_generic_placeholders(monkeypatch):
    state = build_generation_contract_state(strict_request())
    text = "\n".join(
        [
            "Executive Answer",
            "Locked claim: Target led non-Walmart retailer visit rate at 7.1% on 2026-05-16.",
            "Retailer",
            "Visit Rate",
            "Date",
            "Target",
            "7.1%",
            "2026-05-16",
            "Retailer Gamma",
            "Source Placeholder",
        ]
    )

    monkeypatch.setattr(
        generation_contract_module,
        "_extract_pptx",
        lambda _path: (text, []),
    )

    issues = validate_pptx_contract(state, "/tmp/deck.pptx")
    placeholder_issue = next(
        issue for issue in issues if issue.reason == "generic_placeholder_content"
    )

    assert placeholder_issue.stage == "pptx_export"
    assert placeholder_issue.actual == ["Retailer Gamma", "Source Placeholder"]


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


def test_strict_contract_honors_table_row_cell_max_items():
    state = build_generation_contract_state(strict_request())
    narrow_schema = {
        "type": "object",
        "properties": {
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {
                        "type": "array",
                        "maxItems": 4,
                        "items": {
                            "type": "array",
                            "maxItems": 2,
                            "items": {"type": "string"},
                        },
                    },
                },
            },
        },
    }
    wide_schema = copy.deepcopy(narrow_schema)
    wide_schema["properties"]["tableData"]["properties"]["rows"]["items"][
        "maxItems"
    ] = 3

    narrow_content, narrow_issues = overlay_contract_tables({}, narrow_schema, state, 0)
    wide_content, wide_issues = overlay_contract_tables({}, wide_schema, state, 0)

    assert narrow_content == {}
    assert [issue.reason for issue in narrow_issues] == ["no_compatible_table_layout"]
    assert narrow_issues[0].details["maxCellsPerRow"] == 2
    assert "cells_exceed_maxCellsPerRow" in (
        narrow_issues[0].details["candidates"][0]["failure_reasons"]
    )
    assert wide_issues == []
    assert wide_content["tableData"]["rows"] == [["Target", "7.1%", "2026-05-16"]]


def test_strict_contract_honors_table_row_cell_min_items_for_ragged_rows():
    request = strict_request(
        slides_markdown=[
            "\n".join(
                [
                    "### 1. Evidence Table",
                    "",
                    "| Retailer | Visit Rate | Date |",
                    "| --- | --- | --- |",
                    "| Target | 7.1% |",
                ]
            )
        ],
        generation_contract={
            "locked_text": [],
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
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {
                        "type": "array",
                        "maxItems": 4,
                        "items": {
                            "type": "array",
                            "minItems": 3,
                            "maxItems": 4,
                            "items": {"type": "string"},
                        },
                    },
                },
            },
        },
    }

    content, issues = overlay_contract_tables({}, schema, state, 0)

    assert content == {}
    assert [issue.reason for issue in issues] == ["no_compatible_table_layout"]
    assert issues[0].details["minCellsPerRow"] == 3
    assert issues[0].details["minCellsInTableRow"] == 2
    assert issues[0].details["candidates"][0]["failure_reasons"] == [
        "cells_below_minCellsPerRow"
    ]


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


def test_strict_contract_table_fit_failure_includes_structured_details():
    state = build_generation_contract_state(strict_request())
    schema = {
        "type": "object",
        "properties": {
            "tableData": {
                "type": "object",
                "properties": {
                    "headers": {"type": "array", "maxItems": 4},
                    "rows": {
                        "type": "array",
                        "maxItems": 4,
                        "items": {
                            "type": "array",
                            "maxItems": 2,
                            "items": {"type": "string"},
                        },
                    },
                },
            },
        },
    }

    issues = contract_table_issues_for_schema(schema, state, 0)
    details = issues[0].to_dict()["details"]

    assert [issue.reason for issue in issues] == ["no_compatible_table_layout"]
    assert details["issue_code"] == "STRICT_PRESERVE_TABLE_FIT_FAILED"
    assert details["content_kind"] == "evidence_table"
    assert details["source_path"] == "slides_markdown[0]"
    assert details["slide_index"] == 0
    assert details["section_index"] == 1
    assert details["rows"] == 1
    assert details["columns"] == 3
    assert details["maxRows"] == 4
    assert details["maxColumns"] == 4
    assert details["maxCellsPerRow"] == 2
    assert details["candidate_path"] == "tableData"
    assert details["candidate_count"] == 1
    assert details["candidates"][0]["field_path"] == "tableData"
    assert details["candidates"][0]["failure_reasons"] == [
        "cells_exceed_maxCellsPerRow"
    ]


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


def test_enforce_contract_logs_warning_only_issues_without_raising(capsys):
    state = build_generation_contract_state(strict_request())
    warning = ContractIssue(
        reason="table_rendered_as_prose",
        severity="warning",
        message="Source markdown table rendered visibly as prose.",
        stage="slide_content",
        category="strict_table_shape",
    )

    enforce_contract_or_raise(state, [warning], stage="slide_content")

    captured = capsys.readouterr()
    assert "generation_contract" in captured.out
    assert "table_rendered_as_prose" in captured.out


def test_enforce_contract_raises_errors_and_preserves_warnings():
    state = build_generation_contract_state(strict_request())
    warning = ContractIssue(
        reason="table_rendered_as_prose",
        severity="warning",
        message="Source markdown table rendered visibly as prose.",
        stage="slide_content",
    )
    error = ContractIssue(
        reason="changed_table_values",
        message="Expected table values were not preserved visibly.",
        stage="slide_content",
    )

    try:
        enforce_contract_or_raise(state, [warning, error], stage="slide_content")
    except HTTPException as exc:
        assert exc.status_code == 422
        assert exc.detail["issues"][0]["reason"] == "changed_table_values"
        assert exc.detail["warnings"][0]["reason"] == "table_rendered_as_prose"
    else:
        raise AssertionError("Expected strict contract error to fail")


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
