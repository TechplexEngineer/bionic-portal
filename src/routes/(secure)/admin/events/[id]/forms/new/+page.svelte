<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let saving = $state(false);
</script>

<svelte:head><title>New Form | {data.event.name} | Bionic Portal</title></svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">New form for {data.event.name}</h1>
			<p class="text-muted mb-0">Upload a blank PDF before adding form fields.</p>
		</div>
		<a class="btn btn-outline-secondary" href={resolve(`/admin/events/${data.event.id}/forms`)}
			>Back to forms</a
		>
	</header>

	{#if form?.message}
		<div class="alert alert-danger" role="alert">{form.message}</div>
	{/if}

	<div class="card">
		<div class="card-body">
			<h2 class="h5">Set up event form</h2>
			<form
				method="post"
				enctype="multipart/form-data"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update();
						saving = false;
					};
				}}
				class="row g-3 align-items-end"
			>
				<div class="col-md-6">
					<label class="form-label" for="form-name">Form name</label>
					<input id="form-name" name="name" class="form-control" required />
				</div>
				<div class="col-md-6">
					<label class="form-label" for="blank-pdf">Blank PDF</label>
					<input
						id="blank-pdf"
						name="pdf"
						class="form-control"
						type="file"
						accept="application/pdf,.pdf"
						required
					/>
				</div>
				<div class="col-12">
					<button class="btn btn-primary" type="submit" disabled={saving}>
						{saving ? "Uploading…" : "Upload blank PDF"}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
