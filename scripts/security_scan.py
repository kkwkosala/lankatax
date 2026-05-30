#!/usr/bin/env python3
"""
LankaTax — Security Scan Script
OWASP Top 10 checks, secret detection, and
LankaTax-specific security rules on every PR.
"""

import os
import re
import sys
import subprocess

SECURITY_RULES = [
    # Secrets / credentials
    {
        "id": "SEC001",
        "desc": "Secret key pattern",
        "pattern": r"(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,})",
        "message": "Possible API secret key — move to environment variables",
        "severity": "critical",
    },
    {
        "id": "SEC002",
        "desc": "Supabase service role key",
        "pattern": r"service_role.*['\"][a-zA-Z0-9._-]{100,}['\"]",
        "message": "Supabase service_role key must never be committed — use Supabase secrets",
        "severity": "critical",
    },
    {
        "id": "SEC003",
        "desc": "Hardcoded password",
        "pattern": r"password\s*[=:]\s*['\"][^'\"]{6,}['\"]",
        "message": "Hardcoded password detected",
        "severity": "critical",
    },
    {
        "id": "SEC004",
        "desc": "OpenAI API key pattern (not used — kept as generic secret detector)",
        "pattern": r"sk-[a-zA-Z0-9]{32,}",
        "message": "Potential API key detected in source code — move to environment secrets",
        "severity": "critical",
    },
    # Injection
    {
        "id": "SEC005",
        "desc": "SQL injection risk — string interpolation in queries",
        "pattern": r"(query|sql)\s*[=+]\s*[`'\"].*\$\{",
        "message": "SQL query built with template literals — use parameterised queries",
        "severity": "error",
    },
    {
        "id": "SEC006",
        "desc": "XSS risk — innerHTML usage",
        "pattern": r"innerHTML\s*=",
        "message": "Avoid innerHTML — use Angular binding or DomSanitizer",
        "severity": "error",
    },
    # Auth
    {
        "id": "SEC007",
        "desc": "Edge Function missing CORS headers",
        "pattern": r"serve\(async",
        "requires": r"corsHeaders",
        "file_pattern": r"supabase[/\\]functions[/\\].*index\.ts",
        "message": "Edge Function may be missing CORS headers",
        "severity": "warning",
    },
    # Data exposure
    {
        "id": "SEC008",
        "desc": "PII in logs",
        "pattern": r"console\.(log|error|warn).*\b(salary|basicSalary|taxableIncome|password|token|ssn)\b",
        "message": "Do not log salary, tax, or credential data",
        "severity": "error",
    },
    # Environment files
    {
        "id": "SEC009",
        "desc": ".env file committed",
        "pattern": r"",
        "filename_pattern": r"^\.env(\.|$)",
        "message": ".env file should not be committed — add to .gitignore",
        "severity": "critical",
    },
]

SKIP_PATHS = ["node_modules", "dist", ".angular", ".git", "CHANGELOG"]


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


def should_skip(filepath):
    return any(skip in filepath for skip in SKIP_PATHS)


def scan_file(filepath, content):
    issues = []
    filename = os.path.basename(filepath)

    for rule in SECURITY_RULES:
        # Filename-based rules
        if rule.get("filename_pattern"):
            if re.search(rule["filename_pattern"], filename):
                issues.append({
                    "file": filepath, "rule": rule["id"],
                    "message": rule["message"],
                    "severity": rule["severity"], "line": 1,
                })
            continue

        # File pattern filter
        file_pat = rule.get("file_pattern", "")
        if file_pat and not re.search(file_pat, filepath):
            # Run on all files if no file_pattern
            pass

        if not rule.get("pattern"):
            continue

        # Requires check (whole-file)
        if rule.get("requires"):
            if re.search(rule["pattern"], content) and not re.search(rule["requires"], content):
                issues.append({
                    "file": filepath, "rule": rule["id"],
                    "message": rule["message"],
                    "severity": rule["severity"], "line": 1,
                })
            continue

        # Line-by-line
        for i, line in enumerate(content.split("\n"), 1):
            # Skip comments
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("#") or stripped.startswith("*"):
                continue
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
    criticals = 0
    errors = 0

    for filepath in changed_files:
        if should_skip(filepath) or not os.path.exists(filepath):
            continue
        content = read_file(filepath)
        issues = scan_file(filepath, content)
        all_issues.extend(issues)

    if all_issues:
        print("\n🔒 LankaTax Security Scan\n" + "=" * 50)
        for issue in all_issues:
            if issue["severity"] == "critical":
                icon = "🚨"
                criticals += 1
            elif issue["severity"] == "error":
                icon = "❌"
                errors += 1
            else:
                icon = "⚠️"
            print(f"{icon} [{issue['rule']}] {issue['file']}:{issue['line']}")
            print(f"   {issue['message']}\n")

        print(f"\nSummary: {len(all_issues)} issues ({criticals} critical, {errors} errors)")
    else:
        print("✅ Security scan passed — no issues detected")

    sys.exit(1 if (criticals + errors) > 0 else 0)


if __name__ == "__main__":
    main()
