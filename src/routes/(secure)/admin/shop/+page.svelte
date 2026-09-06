<script lang="ts">
	import { enhance } from "$app/forms";
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	layoutState.pageTitle = "Shop Locations";
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<div>
			<h1 class="mb-1">Shop Locations</h1>
			<p class="text-muted mb-0">Manage what is stored at each shop location.</p>
		</div>
		<span class="badge bg-secondary">{data.locations.length} locations</span>
	</div>

	{#if form?.message}
		<div class="alert {form.success ? 'alert-success' : 'alert-danger'}" role="alert">
			{form.message}
		</div>
	{/if}

	<div class="card mb-4">
		<div class="card-header"><strong>Add location</strong></div>
		<div class="card-body">
			<form method="post" action="?/create" use:enhance class="row g-2 align-items-end">
				<div class="col-md-3">
					<label class="form-label" for="new-location">Location</label>
					<input
						id="new-location"
						class="form-control"
						name="location"
						placeholder="W1-G"
						required
						maxlength="100"
					/>
				</div>
				<div class="col-md-6">
					<label class="form-label" for="new-item">Item</label>
					<input
						id="new-item"
						class="form-control"
						name="item"
						placeholder="Item name"
						required
						maxlength="255"
					/>
				</div>
				<div class="col-md-3">
					<button class="btn btn-primary w-100" type="submit">Add location</button>
				</div>
			</form>
		</div>
	</div>

	<div class="table-responsive">
		<table class="table table-striped align-middle">
			<thead><tr><th>Location</th><th>Item</th><th class="text-end">Actions</th></tr></thead>
			<tbody>
				{#each data.locations as shopLocation (shopLocation.id)}
					<tr>
						<td colspan="2">
							<form
								id={`edit-${shopLocation.id}`}
								method="post"
								action="?/update"
								use:enhance
								class="row g-2"
							>
								<input type="hidden" name="id" value={shopLocation.id} />
								<div class="col-md-4">
									<input
										class="form-control"
										aria-label="Location"
										name="location"
										value={shopLocation.location}
										required
										maxlength="100"
									/>
								</div>
								<div class="col-md-8">
									<input
										class="form-control"
										aria-label="Item"
										name="item"
										value={shopLocation.item}
										required
										maxlength="255"
									/>
								</div>
							</form>
						</td>
						<td class="text-end text-nowrap">
							<button class="btn btn-sm btn-primary" type="submit" form={`edit-${shopLocation.id}`}
								>Save</button
							>
							<form
								method="post"
								action="?/delete"
								use:enhance
								class="d-inline"
								onsubmit={(event) => {
									if (!confirm(`Remove ${shopLocation.location}?`)) event.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={shopLocation.id} />
								<button class="btn btn-sm btn-outline-danger" type="submit">Delete</button>
							</form>
						</td>
					</tr>
				{:else}
					<tr><td colspan="3" class="text-center text-muted py-4">No shop locations yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
