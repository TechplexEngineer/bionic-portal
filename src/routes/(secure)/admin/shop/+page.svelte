<script lang="ts">
	import { beforeNavigate } from "$app/navigation";
	import { enhance } from "$app/forms";
	import type { SubmitFunction } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import { layoutState } from "../+layout.svelte";
	import { createShopDrafts, getDirtyShopLocationIds, type ShopDraft } from "$lib/shopDrafts";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	layoutState.pageTitle = "Shop Locations";

	let saved = $state(createShopDrafts(data.locations));
	let drafts = $state(createShopDrafts(data.locations));
	let dirtyIds = $derived(getDirtyShopLocationIds(data.locations, drafts));
	let dirtyCount = $derived(dirtyIds.length);

	$effect(() => {
		for (const shopLocation of data.locations) {
			if (!drafts[shopLocation.id])
				drafts[shopLocation.id] = { location: shopLocation.location, item: shopLocation.item };
			if (!saved[shopLocation.id])
				saved[shopLocation.id] = { location: shopLocation.location, item: shopLocation.item };
		}
	});

	function fieldEdited(id: string, field: keyof ShopDraft) {
		return drafts[id]?.[field] !== saved[id]?.[field];
	}

	function saveRow(id: string): SubmitFunction {
		return () =>
			async ({ result, update }) => {
				if (result.type === "success") saved[id] = { ...drafts[id] };
				await update({ reset: false });
			};
	}

	const saveAll: SubmitFunction =
		() =>
		async ({ result, update }) => {
			if (result.type === "success") {
				for (const id of [...dirtyIds]) saved[id] = { ...drafts[id] };
			}
			await update({ reset: false });
		};

	beforeNavigate(({ cancel }) => {
		if (dirtyCount > 0 && !confirm("You have unsaved shop changes. Leave this page?")) cancel();
	});

	onMount(() => {
		const warnBeforeUnload = (event: BeforeUnloadEvent) => {
			if (dirtyCount > 0) {
				event.preventDefault();
				event.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", warnBeforeUnload);
		return () => window.removeEventListener("beforeunload", warnBeforeUnload);
	});
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<div>
			<h1 class="mb-1">Shop Locations</h1>
			<p class="text-muted mb-0">Manage what is stored at each shop location.</p>
		</div>
		<div class="d-flex align-items-center gap-2">
			{#if dirtyCount > 0}<span class="badge bg-warning text-dark">{dirtyCount} edited</span>{/if}
			<form method="post" action="?/updateAll" use:enhance={saveAll}>
				<input
					type="hidden"
					name="locations"
					value={JSON.stringify(
						data.locations.map((location) => ({ id: location.id, ...drafts[location.id] }))
					)}
				/>
				<button class="btn btn-primary" type="submit" disabled={dirtyCount === 0}>Save All</button>
			</form>
			<span class="badge bg-secondary">{data.locations.length} locations</span>
		</div>
	</div>

	{#if dirtyCount > 0}
		<div class="alert alert-warning" role="status">
			You have unsaved changes. Edited fields are highlighted; save them before leaving this page.
		</div>
	{/if}

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
								use:enhance={saveRow(shopLocation.id)}
								class="row g-2"
							>
								<input type="hidden" name="id" value={shopLocation.id} />
								<div class="col-md-4">
									<input
										class="form-control"
										class:border-warning={fieldEdited(shopLocation.id, "location")}
										class:bg-warning-subtle={fieldEdited(shopLocation.id, "location")}
										aria-label="Location"
										name="location"
										bind:value={drafts[shopLocation.id].location}
										required
										maxlength="100"
									/>
								</div>
								<div class="col-md-8">
									<input
										class="form-control"
										class:border-warning={fieldEdited(shopLocation.id, "item")}
										class:bg-warning-subtle={fieldEdited(shopLocation.id, "item")}
										aria-label="Item"
										name="item"
										bind:value={drafts[shopLocation.id].item}
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
