
# Orryx Starter v2 (Dynamic Path)

Put these files in your new GitHub repo (root). The workflow detects where `package.json` lives and builds from there automatically.

Steps:
1) Confirm `app.json` has your Expo details (owner: naktak00, slug: project-obsidian-oryyx, projectId UUID).
2) Add `EXPO_TOKEN` under GitHub → Settings → Secrets → Actions.
3) Run Actions → Build Android Internal APK (EAS).
4) Download the APK from Artifacts.
