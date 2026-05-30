#!/usr/bin/env python3
"""
LankaTax — GitHub Issue Creator
Creates structured GitHub Issues for LankaTax PBIs.

Usage:
  python automation/create_github_issue.py \
    --title "[DB] Create tax_slabs migration" \
    --body "..." \
    --labels "db,epic:tax-engine,priority:critical,sprint:1" \
    --milestone "Sprint 1 — Tax Engine"

Environment variables required:
  GITHUB_TOKEN  — Personal Access Token with repo scope
  GITHUB_REPO   — e.g. kkwkosala/lankatax
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error


def get_or_create_milestone(headers, repo, milestone_title):
    """Get existing milestone ID or create it."""
    url = f"https://api.github.com/repos/{repo}/milestones"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            milestones = json.loads(resp.read())
            for m in milestones:
                if m["title"] == milestone_title:
                    return m["number"]
    except Exception:
        pass

    # Create milestone
    payload = json.dumps({"title": milestone_title}).encode()
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())["number"]
    except Exception as e:
        print(f"Warning: Could not create milestone '{milestone_title}': {e}")
        return None


def ensure_labels_exist(headers, repo, labels):
    """Ensure all labels exist in the repo."""
    label_colors = {
        "db": "0075ca",
        "backend": "e4e669",
        "frontend": "d73a4a",
        "tax-rule-change": "ff6b35",
        "epic:tax-engine": "5319e7",
        "epic:salary-breakdown": "5319e7",
        "epic:pegging": "5319e7",
        "epic:usd-conversion": "5319e7",
        "epic:tax-admin": "5319e7",
        "epic:reporting": "5319e7",
        "epic:auth": "5319e7",
        "epic:ai-insights": "5319e7",
        "epic:budget": "5319e7",
        "epic:audit": "5319e7",
        "priority:critical": "b60205",
        "priority:high": "e11d48",
        "priority:medium": "f97316",
        "priority:low": "84cc16",
        "sprint:1": "1d76db",
        "sprint:2": "1d76db",
        "sprint:3": "1d76db",
        "sprint:4": "1d76db",
        "sprint:5": "1d76db",
        "sprint:6": "1d76db",
        "feature": "0052cc",
        "bug": "d73a4a",
        "dependencies": "0075ca",
        "ci": "e4e669",
    }

    existing_url = f"https://api.github.com/repos/{repo}/labels?per_page=100"
    existing = set()
    req = urllib.request.Request(existing_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            for label in json.loads(resp.read()):
                existing.add(label["name"])
    except Exception:
        pass

    create_url = f"https://api.github.com/repos/{repo}/labels"
    for label in labels:
        if label not in existing:
            color = label_colors.get(label, "ededed")
            payload = json.dumps({"name": label, "color": color}).encode()
            req = urllib.request.Request(create_url, data=payload, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req) as resp:
                    print(f"  ✅ Created label: {label}")
            except urllib.error.HTTPError as e:
                if e.code != 422:  # 422 = already exists
                    print(f"  ⚠️  Could not create label '{label}': {e}")


def create_issue(token, repo, title, body, labels, milestone_title=None):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "LankaTax-SDLC/1.0",
    }

    label_list = [l.strip() for l in labels.split(",") if l.strip()] if labels else []

    print(f"\n📋 Creating GitHub Issue: {title}")
    print(f"   Repo: {repo}")
    print(f"   Labels: {label_list}")

    # Ensure labels exist
    ensure_labels_exist(headers, repo, label_list)

    # Get/create milestone
    milestone_number = None
    if milestone_title:
        milestone_number = get_or_create_milestone(headers, repo, milestone_title)

    # Create issue
    issue_data = {
        "title": title,
        "body": body,
        "labels": label_list,
    }
    if milestone_number:
        issue_data["milestone"] = milestone_number

    url = f"https://api.github.com/repos/{repo}/issues"
    payload = json.dumps(issue_data).encode()
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as resp:
            issue = json.loads(resp.read())
            print(f"\n✅ Issue created: #{issue['number']} — {issue['title']}")
            print(f"   URL: {issue['html_url']}")
            return issue["number"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"\n❌ Failed to create issue: HTTP {e.code}")
        print(f"   {error_body}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Create LankaTax GitHub Issues")
    parser.add_argument("--title", required=True, help="Issue title")
    parser.add_argument("--body", required=True, help="Issue body (markdown)")
    parser.add_argument("--labels", default="", help="Comma-separated labels")
    parser.add_argument("--milestone", default=None, help="Milestone title")
    parser.add_argument("--repo", default=None, help="GitHub repo (owner/name)")
    parser.add_argument("--token", default=None, help="GitHub token")
    args = parser.parse_args()

    token = args.token or os.environ.get("GITHUB_TOKEN")
    repo = args.repo or os.environ.get("GITHUB_REPO", "kkwkosala/lankatax")

    if not token:
        print("❌ GitHub token required. Set GITHUB_TOKEN env var or use --token")
        sys.exit(1)

    create_issue(token, repo, args.title, args.body, args.labels, args.milestone)


if __name__ == "__main__":
    main()
