# GitHub Activity Report Generator

A Node.js console application that generates a comprehensive report of your
GitHub activity from yesterday, including repository analysis, pull request
tracking, and activity summaries.

## Features

- 📊 **Executive Summary**: Overview of your GitHub activity and repository
  status
- 🔍 **Repository Analysis**: Detailed information about all your repositories
- 🚀 **Activity Tracking**: Yesterday's PRs, comments, and reviews
- 📝 **Dual Output**: Beautiful console display + markdown file export
- 🎯 **Progress Tracking**: Real-time progress indicators and error handling
- 🌈 **Colored Output**: Easy-to-read terminal interface

## Prerequisites

- Node.js 22.0.0 or higher
- GitHub Personal Access Token

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Setup GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with these scopes:
   - `repo` (for private repository access)
   - `user` (for user information)
   - `read:user` (for reading user profile)
3. Copy the token for use with this tool

## Usage

### Basic Usage

```bash
npm start -- --token YOUR_GITHUB_TOKEN
```

### With Custom Username

```bash
npm start -- --token YOUR_GITHUB_TOKEN --username your-github-username
```

### Custom Output File

```bash
npm start -- --token YOUR_GITHUB_TOKEN --output my-report.md
```

### All Options

```bash
npm start -- --token YOUR_GITHUB_TOKEN --username your-username --output custom-report.md
```

## Command Line Options

| Option       | Short | Description                  | Required | Default            |
| ------------ | ----- | ---------------------------- | -------- | ------------------ |
| `--token`    | `-t`  | GitHub personal access token | Yes      | -                  |
| `--username` | `-u`  | GitHub username              | No       | Authenticated user |
| `--output`   | `-o`  | Output markdown filename     | No       | `github-report.md` |
| `--help`     | `-h`  | Show help information        | No       | -                  |
| `--version`  | `-V`  | Show version number          | No       | -                  |

## What the Report Includes

### Executive Summary

- Total repositories analyzed
- Number of active repositories (with yesterday's activity)
- Activity breakdown (PRs created, comments, reviews)
- Error summary if any occurred

### Yesterday's Activities

- Pull requests you created
- Comments you made on PRs and issues
- Code reviews you submitted
- Links to all activities

### Active Projects

- Repositories where you had activity yesterday
- Project descriptions and primary languages
- Latest pull request information
- Direct links to repositories

### Complete Repository List

- All your repositories with status indicators
- Repository descriptions and languages
- Activity status (active/inactive)

## Sample Output

### Console Output

```
🚀 GitHub Activity Report Generator

✓ Connected to GitHub as: yourusername
ℹ Found 42 repositories
✓ Found 15 recent activities
✓ Report saved to: github-report.md

📊 REPORT GENERATED

EXECUTIVE SUMMARY
User: yourusername
Total Repositories: 42
Active Repositories (yesterday): 3
Total Activities: 8
  • PRs Created: 2
  • Comments Made: 4
  • Reviews Given: 2

YESTERDAY'S ACTIVITIES
• Created PR: Fix authentication bug in user service
  Repository: awesome-project
  Time: Sep 12, 2025
  URL: https://github.com/user/awesome-project/pull/123
```

### Markdown Output

The tool generates a detailed markdown report with:

- Structured sections with proper headings
- Clickable links to all GitHub resources
- Clean formatting for easy reading
- Comprehensive project information

## Error Handling

The tool includes robust error handling:

- **Network Issues**: Graceful handling of API timeouts and connectivity
  problems
- **Permission Errors**: Clear messages when repositories are inaccessible
- **Rate Limiting**: Monitoring and warnings for GitHub API rate limits
- **Invalid Tokens**: Clear authentication error messages
- **Partial Failures**: Continues processing even if some repositories fail

## Rate Limiting

GitHub API has rate limits:

- **Authenticated requests**: 5,000 per hour
- The tool monitors your remaining requests
- Warnings appear when limits are low
- Consider the `--username` option to reduce API calls

## Troubl
