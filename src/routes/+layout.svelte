<script lang="ts">
	/// <reference types="svelte" />
	import '../app.css';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/db/pocketbase';
	import config from '@arcgis/core/config';

	config.apiKey = import.meta.env.ESRI_API_KEY;

	// we want to redirect to the root unless the user is looking for the welcome page or home page
	if (browser) {
		currentUser.subscribe((user) => {
			const path = window.location.pathname;
			if (user && path === '/login') {
				goto('/');
			} else if (!user && path !== '/login') {
				goto('/login');
			}
		});
	}
</script>

<div class="min-h-screen w-full">
	<slot />
</div>
