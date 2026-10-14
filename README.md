# ITM 350 Personal Repository

This repository contains my ITM 350 coursework and Week 3 Task Tracker application.

## Week 3 Application

The Task Tracker is a Node.js application that allows users to create, complete, and delete tasks.

Application files are located in `task-tracker/task-tracker/`.

### Running the application

```bash
cd task-tracker/task-tracker
npm install
npm start
```

## Git Command Guide

### git add

Stages changes for the next commit.

- `git add .` stages all changes in the current directory and below.
- `git add README.md` stages one specific file.
- `git add -A` stages all changes, including deletions, throughout the repository.
- `git add -p` allows you to select individual changes to stage.

### git push

Uploads local commits to a remote repository.

- `git push` pushes the current branch when upstream tracking is configured.
- `git push origin main` pushes the local main branch to origin.
- `git push -u origin week3` pushes week3 and sets its upstream tracking branch.
- `git push --dry-run` previews the push without uploading anything.

### git pull

Downloads and integrates changes from a remote repository.

- `git pull` fetches and integrates changes for the current tracking branch.
- `git pull origin main` fetches and integrates the remote main branch.
- `git pull --rebase` rebases local commits on top of fetched changes instead of merging.
- `git pull --ff-only` only updates the branch if a fast-forward is possible.

### Changing the origin URL

The origin remote identifies the repository used for fetching and pushing.

- `git remote -v` displays configured remote URLs.
- `git remote set-url origin NEW_URL` changes the existing origin URL.
- `git remote add origin NEW_URL` adds origin if it does not exist.
- `git remote get-url origin` displays the current origin URL.

### git stash

Temporarily saves uncommitted changes.

- `git stash` saves tracked changes.
- `git stash push -m "Work in progress"` saves changes with a description.
- `git stash -u` includes untracked files.
- `git stash list` displays saved stashes.
- `git stash pop` reapplies and removes the latest stash if successfully applied.
- `git stash apply` reapplies a stash without removing it.

### git revert

Creates a new commit that reverses changes from an earlier commit.

- `git revert HEAD` reverses the latest commit.
- `git revert COMMIT_HASH` reverses a specific commit.
- `git revert --no-commit COMMIT_HASH` applies the reversal without automatically committing.

Revert is useful for undoing changes that have already been pushed because it preserves commit history.

### git reset

Moves the current branch to another commit and can modify staged files or working files.

- `git reset HEAD README.md` unstages a file.
- `git reset --soft HEAD~1` removes the latest commit while keeping its changes staged.
- `git reset --mixed HEAD~1` removes the latest commit and unstages its changes.
- `git reset --hard HEAD~1` discards the latest commit and its working changes.

**Warning:** `--hard` can permanently discard uncommitted work. Avoid using it on shared branches.

### git log

Displays commit history.

- `git log` displays commit history.
- `git log --oneline` displays abbreviated commits.
- `git log --graph --oneline --all` shows a visual history of all branches.
- `git log -5` displays the five most recent commits.
- `git log --author="Name"` filters commits by author.

### git diff

Displays differences between file versions.

- `git diff` displays unstaged changes.
- `git diff --staged` displays staged changes.
- `git diff main..week3` compares the two branches.
- `git diff --stat` summarizes changed files and line counts.
- `git diff -- README.md` displays unstaged changes to the specified file.

### git show

Displays information about a Git object, commonly a commit.

- `git show` displays the latest commit and its changes.
- `git show COMMIT_HASH` displays a specific commit.
- `git show --stat HEAD` displays a summary of the latest commit.
- `git show --format=fuller HEAD` displays detailed commit metadata.
- `git show HEAD:README.md` displays the README as it existed in the latest commit.

## Week 3 Workflow

1. Create a branch using `git checkout -b week3`.
2. Add application files using `git add .`.
3. Commit using `git commit -m "Add week 3 application"`.
4. Push using `git push -u origin week3`.
5. Create a pull request from week3 into main.
6. Request a classmate's review and approval.
7. Merge the approved pull request and delete week3.
