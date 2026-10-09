# Git Workflow Rules

- **DO NOT automatically commit code**: Never run `git commit`, `git push`, or alter git history automatically after editing code, fixing bugs, or implementing features.
- **Leave files in working tree**: Always leave modified files uncommitted in the working directory so the user can review diffs, test, and perform `git commit`/`git push` manually according to their workflow.
- Only run git commit/push if the user explicitly asks for it in their prompt.
