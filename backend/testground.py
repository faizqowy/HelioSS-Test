from audit_tools.cli_input import run_static_analysis
from audit_tools.cli_input import write_markdown_report
import audit_tools.auto_fix as auto_fix
import os
from dotenv import load_dotenv

load_dotenv()
auto_fix.get_openai_client(os.getenv("OPENAI_API_KEY"))
sol_file = "/home/faiz/hackaton-bi/contracts/SimpleEscrow.sol"
output_path = "/home/faiz/hackaton-bi/backend/reports"

functions, variables, invariant_results, slither_issues = run_static_analysis(sol_file)
write_markdown_report(sol_file, functions, variables, invariant_results, slither_issues, output_path)