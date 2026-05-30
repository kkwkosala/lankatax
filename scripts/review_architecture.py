#!/usr/bin/env python3
"""
LankaTax — Architecture Review Script
Validates NX library boundaries, Supabase RLS requirements,
and LankaTax-specific architecture rules on every PR.
"""

import os
import re
import sys
import subprocess


NX_BOUNDARY_RULES = [
    {
        "id": "NX001",
        "desc": "ui-* libs must not import from feature-* or data-access-*",
        "lib_pattern": r"libs[/\\]ui-",
        "forbidden_imports": [r"from ['\"]@lankatax/feature-", r"from ['\"]@lankatax/data-access-"],
        "severity": "error",
    },
    {
        "id": "NX002",
        "desc": "data-access-* libs must not import from feature-* or ui-*",
        "lib_pattern": r"libs[/\\]data-access-",
        "forbidden_imports": [r"from ['\"]@lankatax/feature-", r"from ['\"]@lankatax/ui-"],
        "severity": "error",
    },
]

SUPABASE_RULES = [
    {
        "id": "SB001",
        "desc": "All new SQL tables must have RLS enabled",
        "pattern": r"CREATE TABLE",
        "requires": r"ENABLE ROW LEVEL SECURITY",
        "message": "New table missing ENABLE ROW LEVEL SECURITY",
        "severity": "error",
    },
]

TAX_DOMAIN_RULES = [
    {
        "id": "TD001",
        "desc": "Tax calculation must not be in Angular components",
        "pattern": r"(apitTax|taxableIncome|employeeEpf|peggingAllowance)\s*=\s*[\w.]+\s*[\*\-\+]",
        "file_pattern": r"(component|page)\.ts$",
        "message": "Tax calculations must live in Edge Functions, not Angular components",
        "severity": "error",
    },
    {
        "id": "TD002",
        "desc": "Migration files must be append-only",
        "pattern": r"\b(DROP TABLE|DROP COLUMN|TRUNCATE)\b",
        "file_pattern": r"supabase[/\\]migrations[/\\]",
        "message": "Destructive migration detected — requires explicit sign-off",
        "severity": "warning",
    },
]


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


def check_nx_boundaries(filepath, content):
    issues = []
    for rule in NX_BOUNDARY_RULES:
        if re.search(rule["lib_pattern"], filepath):
            for forbidden in rule["forbidden_imports"]:
                for i, line in enumerate(content.split("\n"), 1):
                    if re.search(forbidden, line):
                        issues.append({
                            "file": filepath, "rule": rule["id"],
                            "message": f"{rule['desc']}: {line.strip()}",
                            "severity": rule["severity"], "line": i,
                        })
    return issues


def check_supabase_rules(filepath, content):
    issues = []
    if filepath.endswith(".sql"):
        for rule in SUPABASE_RULES:
            if re.search(rule["pattern"], content, re.IGNORECASE):
                if not re.search(rule["requires"], content, re.IGNORECASE):
                    issues.append({
                        "file": filepath, "rule": rule["id"],
                        "message": rule["message"],
                        "severity": rule["severity"], "line": 1,
                    })
    return issues


def check_tax_domain(filepath, content):
    issues = []
    for rule in TAX_DOMAIN_RULES:
        file_pat = rule.get("file_pattern", "")
        if file_pat and not re.search(file_pat, filepath):
            continue
        for i, line in enumerate(content.split("\n"), 1):
            if re.search(rule["pattern"], line, re.IGNORECASE):
                issues.append({
                    "file": filepath, "rule": rule["id"],
                    "message": rule["message"],
                    "severity": rule["severity"], "line": i,
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
        all_issues.extend(check_nx_boundaries(filepath, content))
        all_issues.extend(check_supabase_rules(filepath, content))
        all_issues.extend(check_tax_domain(filepath, content))

    if all_issues:
        print("\n🏛️  LankaTax Architecture Review\n" + "=" * 50)
        for issue in all_issues:
            icon = "❌" if issue["severity"] == "error" else "⚠️"
            print(f"{icon} [{issue['rule']}] {issue['file']}:{issue['line']}")
            print(f"   {issue['message']}\n")
            if issue["severity"] == "error":
                errors += 1
        print(f"\nSummary: {len(all_issues)} issues ({errors} errors)")
    else:
        print("✅ Architecture review passed")

    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
