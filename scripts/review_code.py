#!/usr/bin/env python3
"""
LankaTax — AI Code Review Script
Runs on every PR via GitHub Actions.
Reviews Angular, Edge Function, and tax domain patterns.
"""

import os
import sys
import re
import subprocess

RULES = {
    "angular": [
        {
            "id": "ANG001",
            "desc": "Use OnPush change detection",
            "pattern": r"changeDetection\s*:\s*ChangeDetectionStrategy\.Default",
            "message": "Use ChangeDetectionStrategy.OnPush instead of Default",
            "severity": "warning",
        },
        {
            "id": "ANG002",
            "desc": "No 'any' type",
            "pattern": r":\s*any\b",
            "message": "Avoid using 'any' type — use explicit TypeScript types",
            "severity": "warning",
        },
        {
            "id": "ANG003",
            "desc": "No manual subscribe in components",
            "pattern": r"\.subscribe\(",
            "message": "Prefer async pipe over manual subscribe to avoid memory leaks",
            "severity": "info",
        },
    ],
    "edge_function": [
        {
            "id": "EF001",
            "desc": "JWT validation required",
            "pattern": None,
            "check": "missing_jwt_check",
            "message": "Edge Function must validate JWT (check for auth.getUser())",
            "severity": "error",
        },
        {
            "id": "EF002",
            "desc": "No hardcoded tax values",
            "pattern": r"(0\.08|0\.12|0\.03|epf\s*=\s*0\.|etf\s*=\s*0\.)",
            "message": "Do not hardcode EPF/ETF rates — load from tax_rules table",
            "severity": "error",
        },
        {
            "id": "EF003",
            "desc": "No hardcoded tax slabs",
            "pattern": r"(1[,_]200[,_]000|1[,_]700[,_]000|taxSlab\s*=\s*\[)",
            "message": "Do not hardcode tax slab values — load from tax_slabs table",
            "severity": "error",
        },
    ],
    "security": [
        {
            "id": "SEC001",
            "desc": "No secrets committed",
            "pattern": r"(sk-[a-zA-Z0-9]{32,}|eyJ[a-zA-Z0-9_-]{10,}|service_role|anon.*key.*=.*['\"][a-zA-Z0-9]{30,})",
            "message": "Possible secret or API key detected — use environment variables",
            "severity": "error",
        },
        {
            "id": "SEC002",
            "desc": "No console.log with user data",
            "pattern": r"console\.(log|error|warn).*\b(salary|income|tax|password|token)\b",
            "message": "Do not log sensitive salary/tax data or credentials",
            "severity": "warning",
        },
    ],
}


def get_changed_files():
    result = subprocess.run(
        ["git", "diff", "--name-only", "origin/main...HEAD"],
        capture_output=True, text=True
    )
    return result.stdout.strip().split("\n") if result.stdout.strip() else []


def read_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""


def check_jwt_validation(content):
    return "getUser" in content or "auth.uid" in content or "Authorization" in content


def review_file(filepath, content):
    issues = []
    ext = os.path.splitext(filepath)[1]
    is_angular = ext in [".ts", ".html"] and "supabase/functions" not in filepath
    is_edge_fn = "supabase/functions" in filepath and ext == ".ts"

    rule_sets = ["security"]
    if is_angular:
        rule_sets.append("angular")
    if is_edge_fn:
        rule_sets.append("edge_function")

    for rule_set in rule_sets:
        for rule in RULES.get(rule_set, []):
            if rule.get("check") == "missing_jwt_check":
                if is_edge_fn and not check_jwt_validation(content):
                    issues.append({
                        "file": filepath,
                        "rule": rule["id"],
                        "message": rule["message"],
                        "severity": rule["severity"],
                        "line": 1,
                    })
            elif rule.get("pattern"):
                for i, line in enumerate(content.split("\n"), 1):
                    if re.search(rule["pattern"], line, re.IGNORECASE):
                        issues.append({
                            "file": filepath,
                            "rule": rule["id"],
                            "message": rule["message"],
                            "severity": rule["severity"],
                            "line": i,
                        })
    return issues


def main():
    changed_files = get_changed_files()
    all_issues = []
    errors = 0

    for filepath in changed_files:
        if not os.path.exists(filepath):
            continue
        content = read_file(filepath)
        issues = review_file(filepath, content)
        all_issues.extend(issues)

    if all_issues:
        print("\n🔍 LankaTax Code Review Results\n" + "=" * 50)
        for issue in all_issues:
            icon = "❌" if issue["severity"] == "error" else "⚠️" if issue["severity"] == "warning" else "💬"
            print(f"{icon} [{issue['rule']}] {issue['file']}:{issue['line']}")
            print(f"   {issue['message']}\n")
            if issue["severity"] == "error":
                errors += 1

        print(f"\nSummary: {len(all_issues)} issues ({errors} errors)")
    else:
        print("✅ No code review issues found")

    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
