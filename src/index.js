#!/usr/bin/env node

import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import chalk from 'chalk';
import { GitHubService } from './services/github.service.js';
import { GitHubReport } from './models/report.model.js';
import logger from './utils/logger.js';

const program = new Command();

program
  .name('github-report')
  .description('Generate a report of your GitHub activity from yesterday')
  .version('1.0.0')
  .requiredOption('-t, --token <token>', 'GitHub personal access token')
  .option('-u, --username <username>', 'GitHub username (will use authenticated user if not provided)')
  .option('-o, --output <filename>', 'Output markdown file', 'github-report.md')
  .action(async (options) => {
    try {
      await generateReport(options);
    } catch (error) {
      logger.error('Failed to generate report', error.message);
      process.exit(1);
    }
  });

async function generateReport(options) {
  console.log(chalk.bold.blue('\n🚀 GitHub Activity Report Generator\n'));
  
  // Initialize GitHub service
  const githubService = new GitHubService(options.token);
  
  // Validate connection and get user info
  logger.startProgress('Connecting to GitHub...');
  const authenticatedUser = await githubService.validateConnection();
  const username = options.username || authenticatedUser.login;
  logger.stopProgress();

  // Check rate limit
  await githubService.checkRateLimit();

  // Create report instance
  const report = new GitHubReport(username);

  // Fetch repositories
  logger.startProgress('Fetching repositories...');
  const repos = await githubService.getUserRepos(username);
  report.setTotalRepos(repos.length);
  logger.stopProgress();

  // Process each repository
  console.log(chalk.bold(`\nProcessing ${repos.length} repositories...\n`));
  logger.startProgress('Processing repositories...');

  const projects = [];
  for (let i = 0; i < repos.length; i++) {
    const project = await githubService.getRepoDetails(repos[i], i, repos.length);
    projects.push(project);
    report.addProject(project);
  }
  logger.stopProgress();

  // Fetch user activity
  logger.startProgress('Fetching your recent activity...');
  const userActivities = await githubService.getUserActivity(username);
  logger.stopProgress();

  // Map activities to projects
  userActivities.forEach(activity => {
    const project = projects.find(p => 
      p.name === activity.repoName || 
      p.name === activity.repoName.split('/').pop()
    );
    if (project) {
      project.addActivity(activity);
    }
  });

  // Generate and display report
  console.log('\n' + chalk.bold.green('📊 REPORT GENERATED') + '\n');
  displayConsoleReport(report);

  // Save to markdown file
  const markdownContent = generateMarkdownReport(report);
  await writeFile(options.output, markdownContent);
  logger.success(`Report saved to: ${options.output}`);

  // Display summary
  logger.printSummary();
}

function displayConsoleReport(report) {
  const summary = report.getExecutiveSummary();
  const activeProjects = report.getActiveProjects();
  const yesterdayActivities = report.getAllYesterdayActivities();

  // Executive Summary
  console.log(chalk.bold.underline('EXECUTIVE SUMMARY'));
  console.log(`User: ${chalk.cyan(report.username)}`);
  console.log(`Total Repositories: ${chalk.yellow(summary.totalRepos)}`);
  console.log(`Active Repositories (yesterday): ${chalk.green(summary.activeRepos)}`);
  console.log(`Total Activities: ${chalk.blue(summary.totalActivities)}`);
  
  if (summary.totalActivities > 0) {
    console.log(`  • PRs Created: ${chalk.green(summary.createdPRs)}`);
    console.log(`  • Comments Made: ${chalk.blue(summary.comments)}`);
    console.log(`  • Reviews Given: ${chalk.magenta(summary.reviews)}`);
  }

  if (summary.hasErrors) {
    console.log(`Errors Encountered: ${chalk.red(summary.errorCount)}`);
  }

  // Yesterday's Activities
  if (yesterdayActivities.length > 0) {
    console.log('\n' + chalk.bold.underline("YESTERDAY'S ACTIVITIES"));
    yesterdayActivities.forEach(activity => {
      console.log(`${chalk.cyan('•')} ${activity.getTypeDisplay()}: ${activity.title}`);
      console.log(`  ${chalk.gray('Repository:')} ${activity.repoName}`);
      console.log(`  ${chalk.gray('Time:')} ${activity.getFormattedDate()}`);
      console.log(`  ${chalk.gray('URL:')} ${activity.url}\n`);
    });
  }

  // Active Projects Summary
  if (activeProjects.length > 0) {
    console.log(chalk.bold.underline('ACTIVE PROJECTS'));
    activeProjects.forEach(project => {
      console.log(`${chalk.cyan('•')} ${project.name}`);
      console.log(`  ${chalk.gray('Description:')} ${project.description}`);
      if (project.language) {
        console.log(`  ${chalk.gray('Language:')} ${project.language}`);
      }
      console.log(`  ${chalk.gray('Activities:')} ${project.getYesterdayActivities().length}`);
      console.log(`  ${chalk.gray('URL:')} ${project.url}\n`);
    });
  } else {
    console.log('\n' + chalk.yellow('No activity detected for yesterday.'));
    console.log('This could mean:');
    console.log('• No GitHub activity occurred yesterday');
    console.log('• Activities occurred in private repositories not accessible');
    console.log('• Rate limiting prevented full data collection');
  }
}

function generateMarkdownReport(report) {
  const summary = report.getExecutiveSummary();
  const activeProjects = report.getActiveProjects();
  const yesterdayActivities = report.getAllYesterdayActivities();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let markdown = `# GitHub Activity Report

**User:** ${report.username}  
**Generated:** ${report.generatedAt.toLocaleString()}  
**Report Date:** ${yesterday.toDateString()}

## Executive Summary

- **Total Repositories Analyzed:** ${summary.totalRepos}
- **Active Repositories:** ${summary.activeRepos}
- **Total Activities:** ${summary.totalActivities}
  - PRs Created: ${summary.createdPRs}
  - Comments Made: ${summary.comments}
  - Reviews Given: ${summary.reviews}

`;

  if (yesterdayActivities.length > 0) {
    markdown += `## Yesterday's Activities

`;
    yesterdayActivities.forEach(activity => {
      markdown += `### ${activity.getTypeDisplay()}
**${activity.title}**
- Repository: ${activity.repoName}
- Date: ${activity.getFormattedDate()}
- [View on GitHub](${activity.url})

`;
    });
  }

  if (activeProjects.length > 0) {
    markdown += `## Active Projects

`;
    activeProjects.forEach(project => {
      markdown += `### [${project.name}](${project.url})
${project.description}

`;
      if (project.language) {
        markdown += `**Language:** ${project.language}  
`;
      }

      const activities = project.getYesterdayActivities();
      if (activities.length > 0) {
        markdown += `**Yesterday's Activities:**
`;
        activities.forEach(activity => {
          markdown += `- ${activity.getTypeDisplay()}: [${activity.title}](${activity.url})
`;
        });
      }

      if (project.lastPR) {
        markdown += `**Latest PR:** [${project.lastPR.title}](${project.lastPR.url}) by ${project.lastPR.author} (${project.lastPR.getFormattedDate()})
`;
      }

      markdown += '\n';
    });
  }

  if (report.projects.length > activeProjects.length) {
    const inactiveProjects = report.projects.filter(p => !p.hasYesterdayActivity());
    markdown += `## All Repositories (${report.projects.length} total)

`;
    report.projects.forEach(project => {
      const status = project.hasYesterdayActivity() ? '🟢' : '⚪';
      markdown += `${status} [${project.name}](${project.url})`;
      if (project.language) {
        markdown += ` (${project.language})`;
      }
      markdown += `  
${project.description}

`;
    });
  }

  if (summary.hasErrors) {
    markdown += `## Errors Encountered

${summary.errorCount} error(s) occurred during report generation. Check the console output for details.

`;
  }

  markdown += `---
*Report generated by GitHub Activity Report Generator*
`;

  return markdown;
}

program.parse();