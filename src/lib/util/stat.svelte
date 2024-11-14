<script lang="ts">
    export let title: string;
    export let value: string;
    export let description: string;
    export let disabled: boolean = false;
</script>
<div class={`stats shadow mt-4 ${disabled ? 'bg-slate-200' : 'bg-secondary'} text-white`}>  
    <div class="stat">
      <div class="stat-title text-white text-md">{title}</div>
      <div class="stat-value text-lg">{value}</div>
      <div class="stat-desc text-white text-sm">{description}</div>
    </div>
</div>