<script lang="ts">
    export let cols: string[];
</script>
<tr>
    {#each cols as col}
        <th class="max-w-[12em]">{col}</th>
    {/each}
    <th></th>
</tr>