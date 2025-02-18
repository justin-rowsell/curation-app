<script lang="ts">
	import Map from "$lib/map/map.svelte";
	import { pbSignOut } from "$lib/db/pocketbase";
</script>

<div class="flex w-full lg:h-[calc(100vh-11.5rem)] h-screen relative">
	<Map />
	<button
		class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-md transition-colors"
		on:click={() => {
			// Clear any auth tokens or state
			pbSignOut();
			window.location.href = '/login'; // Redirect to login page
		}}
	>
		Sign Out
	</button>
</div>