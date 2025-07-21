from flask import Flask, request, jsonify, render_template_string
from audit_tools.cli_input import run_static_analysis, write_markdown_report
from pathlib import Path
import markdown

app = Flask(__name__)

@app.route("/analyze", methods=["POST"])
def analyze_contract():
    data = request.get_json()
    sol_file = data.get("sol_file")
    output_dir = data.get("output_path", "./reports")

    if not sol_file or not Path(sol_file).exists():
        return jsonify({"error": "Invalid or missing 'sol_file' path"}), 400

    try:
        # Run analysis
        functions, variables, invariant_results, slither_issues = run_static_analysis(sol_file)

        # Generate report
        report_path = Path(output_dir) / f"{Path(sol_file).stem}_report.md"
        write_markdown_report(sol_file, functions, variables, invariant_results, slither_issues, report_path=str(report_path))

        return jsonify({
            "message": "✅ Analysis complete",
            "report_url": f"/view-report/{Path(sol_file).stem}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/view-report/<contract_name>")
def view_report(contract_name):
    report_path = Path("reports") / f"{contract_name}_report.md"
    if not report_path.exists():
        return f"<h1>❌ Report for {contract_name} not found</h1>", 404

    md_content = report_path.read_text()
    html_content = markdown.markdown(md_content, extensions=["extra", "tables"])
    
    # Wrap it with simple HTML
    return render_template_string(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{contract_name} - Audit Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: auto; padding: 2rem; }}
            code {{ background: #f4f4f4; padding: 2px 4px; border-radius: 4px; }}
            pre {{ background: #f4f4f4; padding: 1rem; overflow-x: auto; }}
            h1, h2, h3 {{ color: #2c3e50; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """)

if __name__ == "__main__":
    app.run(debug=True)
