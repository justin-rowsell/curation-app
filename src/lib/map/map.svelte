<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Toast from '$lib/util/toast.svelte';

	let toast: Toast;

	let viewRef: HTMLDivElement;
	let tableRef: HTMLDivElement;

	let cleanup: () => void;
	onMount(async () => {
		const { init } = await import('$lib/map/mapping');
		cleanup = await init(viewRef, tableRef);
	});

	onDestroy(() => {
		cleanup && cleanup();
	});
</script>

<div class="w-full h-screen flex flex-col">
	<div class="w-full h-3/5 flex" bind:this={viewRef}></div>
	<div
		id="select-by-rectangle"
		class="esri-widget esri-widget--button esri-widget esri-interactive"
		title="Select features by rectangle"
	>
		<span class="esri-icon-checkbox-unchecked"></span>
	</div>
	<div
		id="clear-selection"
		class="esri-widget esri-widget--button esri-widget esri-interactive"
		title="Clear selection"
	>
		<span class="esri-icon-erase"></span>
	</div>
    <!-- <div class="esri-widget esri-widget--button esri-widget esri-interactive" 
        id="promote-button" 
        title="Promote selected features">
        <span class="esri-icon-arrow-up"></span>
    </div> -->
	<div class="w-full h-2/5 flex">
		<div bind:this={tableRef} id="tableDiv"></div>
	</div>
</div>

<Toast bind:this={toast} />
