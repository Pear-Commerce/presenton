from typing import Any, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from enums.tone import Tone
from enums.verbosity import Verbosity


class RequiredSectionContract(BaseModel):
    model_config = ConfigDict(extra="allow")

    index: Optional[int] = Field(
        default=None, description="1-based slide/section index this contract covers"
    )
    title: Optional[str] = Field(default=None, description="Required section title")
    content: Optional[str] = Field(
        default=None, description="Required section content or markdown"
    )


class EvidenceTableContract(BaseModel):
    model_config = ConfigDict(extra="allow")

    slide_index: Optional[int] = Field(
        default=None, description="1-based slide/section index for this table"
    )
    section_title: Optional[str] = Field(
        default=None, description="Section title this table belongs to"
    )
    headers: List[str] = Field(default_factory=list)
    rows: List[List[Any]] = Field(default_factory=list)
    markdown: Optional[str] = Field(
        default=None, description="Optional source markdown table"
    )
    required: bool = Field(
        default=True, description="Whether this table must render as a table"
    )


class GenerationContract(BaseModel):
    model_config = ConfigDict(extra="allow")

    locked_text: List[str] = Field(
        default_factory=list,
        description="Sentences or phrases that must appear verbatim",
    )
    required_sections: List[RequiredSectionContract | str] = Field(
        default_factory=list,
        description="Required slide/section list in order",
    )
    forbidden_additions: List[str] = Field(
        default_factory=list,
        description="Phrases or concepts that must not appear",
    )
    evidence_tables: List[EvidenceTableContract] = Field(
        default_factory=list,
        description="Tables whose dimensions and values must be preserved",
    )
    exact_terms: List[str] = Field(
        default_factory=list,
        description="Metrics, dates, labels, and nouns that must not be changed",
    )
    tables_are_evidence: bool = Field(
        default=False,
        description="Fail strict mode when evidence tables cannot render as tables",
    )
    violation_policy: Literal["fail", "warn"] = Field(
        default="fail",
        description="Whether strict-mode violations fail the request or warn only",
    )


class GeneratePresentationRequest(BaseModel):
    content: str = Field(..., description="The content for generating the presentation")
    slides_markdown: Optional[List[str]] = Field(
        default=None, description="The markdown for the slides"
    )
    instructions: Optional[str] = Field(
        default=None, description="The instruction for generating the presentation"
    )
    tone: Tone = Field(default=Tone.DEFAULT, description="The tone to use for the text")
    verbosity: Verbosity = Field(
        default=Verbosity.STANDARD, description="How verbose the presentation should be"
    )
    web_search: bool = Field(default=False, description="Whether to enable web search")
    n_slides: Optional[int] = Field(
        default=None,
        description="Number of slides to generate. If omitted, model auto-detects slide count.",
    )
    language: Optional[str] = Field(
        default=None,
        description="Language for the presentation. If omitted, model auto-detects language.",
    )
    template: str = Field(
        default="general", description="Template to use for the presentation"
    )
    include_table_of_contents: bool = Field(
        default=False, description="Whether to include a table of contents"
    )
    include_title_slide: bool = Field(
        default=True, description="Whether to include a title slide"
    )
    files: Optional[List[str]] = Field(
        default=None, description="Files to use for the presentation"
    )
    export_as: Literal["pptx", "pdf"] = Field(
        default="pptx", description="Export format"
    )
    trigger_webhook: bool = Field(
        default=False, description="Whether to trigger subscribed webhooks"
    )
    contract_mode: Literal["off", "strict"] = Field(
        default="off",
        description="Use strict to preserve supplied story/facts/evidence contracts",
    )
    generation_mode: Literal["standard", "layout_from_contract"] = Field(
        default="standard",
        description="Use layout_from_contract to let AI choose layouts from fixed content",
    )
    content_generation: Literal["generate", "preserve"] = Field(
        default="generate",
        description="Use preserve to prevent AI from rewriting source facts/evidence",
    )
    generation_contract: Optional[GenerationContract] = Field(
        default=None,
        description="Strict-mode content preservation contract",
    )
