<script lang="ts">
	import type { PageProps } from "./$types";
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Parent Dashboard | Bionic Portal</title></svelte:head>
<div class="container py-4">
	<div class="d-flex justify-content-between align-items-center mb-4">
		<h1>Parent Dashboard</h1>
		<a class="btn btn-outline-primary" href="/register/parent">Link another student</a>
	</div>
	{#if data.tasks.length === 0}
		<div class="alert alert-success">You have no pending parent signatures.</div>
	{:else}
		<h2 class="h4">Signatures needed</h2>
		<div class="list-group">
			{#each data.tasks as task (task.inviteId)}
				<a
					class="list-group-item list-group-item-action"
					href="/dashboard/parent/forms/{task.inviteId}"
				>
					<div class="d-flex justify-content-between">
						<strong>{task.formName}</strong><span>{task.studentName}</span>
					</div>
					<small class="text-muted">{task.eventName}</small>
				</a>
			{/each}
		</div>
	{/if}
</div>
