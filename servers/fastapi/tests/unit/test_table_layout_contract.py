from pathlib import Path


def test_general_table_info_slide_renders_table_data_as_semantic_table():
    repo_root = Path(__file__).resolve().parents[4]
    layout_path = (
        repo_root
        / "servers"
        / "nextjs"
        / "app"
        / "presentation-templates"
        / "general"
        / "TableInfoSlideLayout.tsx"
    )
    source = layout_path.read_text()
    table_markup = source[source.index("<table") : source.index("</table>")]

    assert "<thead" in table_markup
    assert "<tbody" in table_markup
    assert "<th" in table_markup
    assert "<td" in table_markup
    assert "gridTemplateColumns" not in table_markup
