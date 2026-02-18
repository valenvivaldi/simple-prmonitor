npm install -> to install the dependencies
npm run dev -> to run the project in development mode
npm run build -> to build the project
npm run compress -> to compress the project in a zip file

Debugging credentials (development only)

You can create a `public/debug-credentials.json` file (do NOT commit real secrets) to prefill credentials when running `npm run dev`.

Example `public/debug-credentials.json`:

```
{
	"github": {
		"token": "ghp_exampletoken"
	},
	"bitbucket": {
		"username": "your-username",
		"appPassword": "your-app-password",
		"whitelistedRepos": ["workspace/repo1", "workspace/repo2"]
	}
}
```

When `vite` runs in development mode the app will attempt to fetch `/debug-credentials.json` and set the credentials into `chrome.storage.local` (if available) or `localStorage` under the key `pr-viewer-credentials`. Bitbucket whitelisted repos (if provided) will be stored in `bb-whitelisted-repos`.

This is intended for local debugging only; remove the file or disable the loader before building for production.