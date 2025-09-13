import { Octokit } from '@octokit/rest';
import logger from '../utils/logger.js';
import { PullRequest, Activity, ProjectSummary } from '../models/report.model.js';

export class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
    });
    this.rateLimitRemaining = null;
  }

  async validateConnection() {
    try {
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      logger.success(`Connected to GitHub as: ${user.login}`);
      return user;
    } catch (error) {
      logger.error('Failed to connect to GitHub', error.message);
      throw new Error('GitHub authentication failed');
    }
  }

  async getUserRepos(username) {
    try {
      logger.info(`Fetching repositories for user: ${username}`);
      
      const repos = [];
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const { data } = await this.octokit.rest.repos.listForUser({
          username,
          type: 'all',
          sort: 'updated',
          per_page: 100,
          page
        });

        repos.push(...data);
        hasMorePages = data.length === 100;
        page++;

        // Update rate limit info
        this.updateRateLimit();
      }

      logger.success(`Found ${repos.length} repositories`);
      return repos;
    } catch (error) {
      logger.error('Failed to fetch repositories', error.message);
      throw error;
    }
  }

  async getRepoDetails(repo, currentIndex, totalRepos) {
    const repoName = repo.full_name;
    
    try {
      logger.progressWithPercentage(currentIndex + 1, totalRepos, repoName);

      const project = new ProjectSummary(
        repo.name,
        repo.description,
        repo.html_url,
        repo.language
      );

      // Get the most recent PR for this repo
      const lastPR = await this.getLastPRForRepo(repo.owner.login, repo.name);
      if (lastPR) {
        project.lastPR = lastPR;
      }

      return project;
    } catch (error) {
      logger.error(`Failed to process repo: ${repoName}`, error.message);
      return new ProjectSummary(repo.name, repo.description, repo.html_url, repo.language);
    }
  }

  async getLastPRForRepo(owner, repo) {
    try {
      const { data: prs } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 1
      });

      if (prs.length > 0) {
        const pr = prs[0];
        return new PullRequest(
          pr.title,
          pr.html_url,
          pr.user.login,
          pr.updated_at,
          pr.state
        );
      }
      return null;
    } catch (error) {
      // Don't log individual PR fetch errors - they're often due to permissions
      return null;
    }
  }

  async getUserActivity(username) {
    try {
      logger.info('Fetching recent user activity...');
      
      const activities = [];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Get recent events for the user
      const { data: events } = await this.octokit.rest.activity.listEventsForUser({
        username,
        per_page: 100
      });

      for (const event of events) {
        const eventDate = new Date(event.created_at);
        
        // Focus on recent events (last 7 days to catch yesterday's activity)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        if (eventDate < weekAgo) continue;

        let activity = null;

        switch (event.type) {
          case 'PullRequestEvent':
            if (event.payload.action === 'opened') {
              activity = new Activity(
                'pr_created',
                event.payload.pull_request.title,
                event.payload.pull_request.html_url,
                event.created_at,
                event.repo.name
              );
            }
            break;
            
          case 'IssueCommentEvent':
            if (event.payload.issue.pull_request) {
              activity = new Activity(
                'pr_commented',
                `Comment on: ${event.payload.issue.title}`,
                event.payload.comment.html_url,
                event.created_at,
                event.repo.name
              );
            } else {
              activity = new Activity(
                'issue_commented',
                `Comment on: ${event.payload.issue.title}`,
                event.payload.comment.html_url,
                event.created_at,
                event.repo.name
              );
            }
            break;
            
          case 'PullRequestReviewEvent':
            activity = new Activity(
              'pr_reviewed',
              `Review: ${event.payload.pull_request.title}`,
              event.payload.review.html_url,
              event.created_at,
              event.repo.name
            );
            break;
        }

        if (activity) {
          activities.push(activity);
        }
      }

      logger.success(`Found ${activities.length} recent activities`);
      return activities;
    } catch (error) {
      logger.error('Failed to fetch user activity', error.message);
      return [];
    }
  }

  updateRateLimit() {
    // This would be called after each API request to track rate limits
    // For now, we'll keep it simple
  }

  async checkRateLimit() {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      const remaining = data.rate.remaining;
      const resetTime = new Date(data.rate.reset * 1000);
      
      logger.info(`Rate limit: ${remaining} requests remaining (resets at ${resetTime.toLocaleTimeString()})`);
      
      if (remaining < 10) {
        logger.warning('Low rate limit remaining - consider waiting before making more requests');
      }
      
      return data.rate;
    } catch (error) {
      logger.warning('Could not check rate limit');
      return null;
    }
  }
}