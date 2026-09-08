<script lang="ts">
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Forms | {data.event.name} | Bionic Portal</title></svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">Forms for {data.event.name}</h1>
			<p class="text-muted mb-0">Manage reusable event forms.</p>
		</div>
		<div class="d-flex gap-2">
			<a
				class="btn btn-outline-secondary"
				href={resolve(`/admin/events/${data.event.id}/registrations`)}>Registrations</a
			>
			<a class="btn btn-primary" href={resolve(`/admin/events/${data.event.id}/forms/new`)}
				>Create New Form</a
			>
		</div>
	</header>

	<div class="card">
		<div class="card-body">
			<h2 class="h5">Saved forms</h2>
			{#if data.forms.length === 0}
				<p class="text-muted mb-0">No forms added yet.</p>
			{:else}
				<div class="list-group list-group-flush">
					{#each data.forms as savedForm (savedForm.id)}
						<div class="list-group-item px-0 d-flex justify-content-between align-items-center">
							<div>
								<div class="fw-semibold">{savedForm.name}</div>
								<div class="text-muted small">
									{(savedForm.definition as { fields: unknown[] }).fields.length} fields
								</div>
							</div>
							<div class="d-flex gap-2">
								<a
									class="btn btn-outline-secondary btn-sm"
									href={resolve(`/admin/events/${data.event.id}/forms/${savedForm.id}`)}>View</a
								>
								<a
									class="btn btn-outline-primary btn-sm"
									href={resolve(`/admin/events/${data.event.id}/forms/${savedForm.id}/edit`)}
									>Edit</a
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
