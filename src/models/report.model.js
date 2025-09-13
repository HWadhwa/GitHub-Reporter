export class PullRequest {
  constructor(title, url, author, date, state = 'unknown') {
    this.title = title;
    this.url = url;
    this.author = author;
    this.date = new Date(date);
    this.state = state;
  }

  getFormattedDate() {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  isFromYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.date >= yesterday && this.date < tomorrow;
  }
}

export class Activity {
  constructor(type, title, url, date, repoName) {
    this.type = type; // 'pr_created', 'pr_commented', 'pr_reviewed'
    this.title = title;
    this.url = url;
    this.date = new Date(date);
    this.repoName = repoName;
  }

  getFormattedDate() {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  isFromYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.date >= yesterday && this.date < tomorrow;
  }

  getTypeDisplay() {
    const typeMap = {
      'pr_created': 'Created PR',
      'pr_commented': 'Commented on PR',
      'pr_reviewed': 'Reviewed PR',
      'issue_commented': 'Commented on Issue'
    };
    return typeMap[this.type] || this.type;
  }
}

export class ProjectSummary {
  constructor(name, description, url, language, lastPR = null) {
    this.name = name;
    this.description = description || 'No description available';
    this.url = url;
    this.language = language;
    this.lastPR = lastPR;
    this.myActivities = [];
  }

  addActivity(activity) {
    this.myActivities.push(activity);
  }

  hasYesterdayActivity() {
    return this.myActivities.some(activity => activity.isFromYesterday()) ||
           (this.lastPR && this.lastPR.isFromYesterday());
  }

  getYesterdayActivities() {
    return this.myActivities.filter(activity => activity.isFromYesterday());
  }
}

export class GitHubReport {
  constructor(username) {
    this.username = username;
    this.generatedAt = new Date();
    this.projects = [];
    this.totalReposAnalyzed = 0;
    this.errors = [];
  }

  addProject(project) {
    this.projects.push(project);
  }

  setTotalRepos(count) {
    this.totalReposAnalyzed = count;
  }

  addError(error) {
    this.errors.push(error);
  }

  getActiveProjects() {
    return this.projects.filter(project => project.hasYesterdayActivity());
  }

  getAllYesterdayActivities() {
    const activities = [];
    this.projects.forEach(project => {
      activities.push(...project.getYesterdayActivities());
    });
    return activities.sort((a, b) => b.date - a.date);
  }

  getExecutiveSummary() {
    const activeProjects = this.getActiveProjects();
    const yesterdayActivities = this.getAllYesterdayActivities();
    
    return {
      totalRepos: this.totalReposAnalyzed,
      activeRepos: activeProjects.length,
      totalActivities: yesterdayActivities.length,
      createdPRs: yesterdayActivities.filter(a => a.type === 'pr_created').length,
      comments: yesterdayActivities.filter(a => a.type === 'pr_commented').length,
      reviews: yesterdayActivities.filter(a => a.type === 'pr_reviewed').length,
      hasErrors: this.errors.length > 0,
      errorCount: this.errors.length
    };
  }
}