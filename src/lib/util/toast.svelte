<script lang="ts">
	export let message = '';
	export let alertClass = 'alert alert-error';

	export function callToast(msg: string, type?: string | undefined, ms?: number | undefined) {
		let milliseconds: number = 10000;
		if (ms) {
			milliseconds = ms;
		}
		if (type) {
			alertClass = type === 'success' ? 'alert bg-[#36d399]' : type === 'info' ? 'alert bg-[#FFFBCC]' : `alert alert-${type}`;
		}
		message = msg;

		setTimeout(() => {
			message = '';
		}, milliseconds);
	}
</script>

<div class="toast toast-bottom toast-center z-40">
	{#if message}
		<div class={alertClass}>
			<div>
				<span>{message}</span>
			</div>
		</div>
	{/if}
</div>
