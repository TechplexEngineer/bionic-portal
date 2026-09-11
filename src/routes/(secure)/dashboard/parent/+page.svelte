<script lang="ts">
	import type { PageProps } from "./$types";
	import { hasPendingActionItems } from "$lib/profileActions";
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Parent Dashboard | Bionic Portal</title></svelte:head>
<div class="container py-4">
	<div class="d-flex justify-content-between align-items-center mb-4">
		<h1>Parent Dashboard</h1>
		<a class="btn btn-outline-primary" href="/register/parent">Link another student</a>
	</div>
	<div class="card shadow-sm">
		<div class="card-header bg-warning bg-opacity-10">
			<h2 class="h4 mb-0">
				<i class="fa fa-exclamation-circle text-warning me-2"></i>Action Items
			</h2>
		</div>
		<div class="card-body">
			{#if data.profileCompleteness.incomplete}
				<a
					href={`${data.profileCompleteness.href}?returnTo=${encodeURIComponent("/dashboard/parent")}`}
					class="alert alert-danger d-block text-decoration-none"
				>
					<i class="fa fa-user me-2"></i>
					<strong>Complete your profile</strong>
					<div class="small mt-1">Missing: {data.profileCompleteness.missingFields.join(", ")}</div>
				</a>
			{/if}
			{#if !hasPendingActionItems(data.profileCompleteness.incomplete, data.tasks.length)}
				<div class="alert alert-success mb-0">You have no pending parent signatures.</div>
			{:else}
				<h3 class="h5">Signatures needed</h3>
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
	</div>
</div>
