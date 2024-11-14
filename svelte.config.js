import azure from 'svelte-adapter-azure-swa';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: azure({
			customStaticWebAppConfig: {
				routes: [
					{
						"route": "/login",
						"rewrite": "/.auth/login/aad?post_login_redirect_uri=/events",
						"allowedRoles": ["anonymous", "authenticated"]
					},
					{
						"route": "/.auth/login/github",
						"statusCode": 404
					},
					{
						"route": "/.auth/login/twitter",
						"statusCode": 404
					},
					{
						"route": "/logout",
						"redirect": "/.auth/logout",
						"allowedRoles": ["anonymous", "authenticated"]
					},
					{
						"route": "/events/*",
						"allowedRoles": ["authenticated"]
					},
					{
						"route": "/customers/*",
						"allowedRoles": ["authenticated"]
					},
					{
						"route": "/admin/*",
						"allowedRoles": ["authenticated"]
					}
				],
				responseOverrides: {
					'401': {
						'redirect': '/login',
						'statusCode': 302
					}
				}
			}
		})
	}
};

export default config;
