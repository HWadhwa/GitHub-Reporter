import chalk from 'chalk';
import ora from 'ora';

class Logger {
  constructor() {
    this.errors = [];
    this.spinner = null;
  }

  info(message) {
    if (this.spinner) this.spinner.stop();
    console.log(chalk.blue('ℹ'), message);
    if (this.spinner) this.spinner.start();
  }

  success(message) {
    if (this.spinner) this.spinner.stop();
    console.log(chalk.green('✓'), message);
    if (this.spinner) this.spinner.start();
  }

  warning(message) {
    if (this.spinner) this.spinner.stop();
    console.log(chalk.yellow('⚠'), message);
    if (this.spinner) this.spinner.start();
  }

  error(message, context = null) {
    if (this.spinner) this.spinner.stop();
    console.log(chalk.red('✗'), message);
    
    const errorEntry = {
      message,
      context,
      timestamp: new Date().toISOString()
    };
    this.errors.push(errorEntry);
    
    if (this.spinner) this.spinner.start();
  }

  startProgress(message) {
    this.spinner = ora({
      text: message,
      color: 'cyan'
    }).start();
  }

  updateProgress(message) {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  stopProgress() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  progressWithPercentage(current, total, repoName = '') {
    const percentage = Math.round((current / total) * 100);
    const progress = `[${current}/${total}] ${percentage}%`;
    const message = repoName 
      ? `${progress} - Processing: ${chalk.cyan(repoName)}`
      : `${progress}`;
    
    this.updateProgress(message);
  }

  getErrors() {
    return this.errors;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  printSummary() {
    console.log('\n' + chalk.bold('='.repeat(50)));
    console.log(chalk.bold('PROCESSING SUMMARY'));
    console.log(chalk.bold('='.repeat(50)));
    
    if (this.hasErrors()) {
      console.log(chalk.red(`\n${this.errors.length} error(s) occurred:`));
      this.errors.forEach((error, index) => {
        console.log(chalk.red(`${index + 1}. ${error.message}`));
        if (error.context) {
          console.log(chalk.gray(`   Context: ${error.context}`));
        }
      });
    } else {
      console.log(chalk.green('\n✓ All operations completed successfully!'));
    }
  }
}

export default new Logger();