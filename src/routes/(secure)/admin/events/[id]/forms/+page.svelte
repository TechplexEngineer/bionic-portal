<script lang="ts">
	import "bionic-sign/styles.css";
	import { PdfFormDesigner, type FormDefinition, type PdfSource } from "bionic-sign";
	import type { PageProps } from "./$types";
	import { enhance } from "$app/forms";

	let { data, form }: PageProps = $props();
	let formName = $state("");
	let definition = $state<FormDefinition>({ version: 1, fields: [] });
	let source = $state<PdfSource>();
	let pdfFile = $state<File>();
	let saving = $state(false);
	let pdfError = $state("");

	async function choosePdf(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.type !== "application/pdf") {
			pdfError = "Choose a PDF document.";
			return;
		}
		pdfFile = file;
		source = new Uint8Array(await file.arrayBuffer());
		pdfError = "";
	}
</script>

<svelte:head><title>Event Forms | {data.event.name} | Bionic Portal</title></svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">Forms for {data.event.name}</h1>
			<p class="text-muted mb-0">Create reusable forms with Bionic Sign.</p>
		</div>
		<a class="btn btn-outline-secondary" href="/admin/events/{data.event.id}/registrations"
			>Registrations</a
		>
	</header>

	{#if form?.message}<div class="alert alert-danger">{form.message}</div>{/if}
	<div class="row g-4">
		<div class="col-12">
			<div class="card">
				<div class="card-body">
					<h2 class="h5">Add a form</h2>
					<p class="small text-muted">Upload the blank PDF before opening the field editor.</p>
					<form
						method="post"
						action="?/save"
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
						<div class="col-md-5">
							<label class="form-label" for="form-name">Form name</label>
							<input
								id="form-name"
								name="name"
								class="form-control"
								bind:value={formName}
								placeholder="Field trip permission"
								required
							/>
						</div>
						<div class="col-md-5">
							<label class="form-label" for="base-pdf">Blank PDF</label>
							<input
								id="base-pdf"
								name="pdf"
								class="form-control"
								type="file"
								accept="application/pdf,.pdf"
								onchange={choosePdf}
								required
							/>
							{#if pdfError}<div class="text-danger small mt-1">{pdfError}</div>{/if}
						</div>
						<div class="col-md-2">
							<input type="hidden" name="definition" value={JSON.stringify(definition)} />
							<button class="btn btn-primary w-100" type="submit" disabled={saving || !pdfFile}
								>{saving ? "Saving…" : "Save form"}</button
							>
						</div>
					</form>
				</div>
			</div>
		</div>
		<div class="col-12">
			<div class="card">
				<div class="card-body">
					{#if source}<div class="bionic-sign w-100">
							<PdfFormDesigner
								{source}
								{definition}
								ondefinitionchange={(next) => (definition = next)}
							/>
						</div>{:else}<div class="text-center text-muted py-5">
							Choose a PDF to open the form creator.
						</div>{/if}
				</div>
			</div>
		</div>
		<div class="col-12">
			<div class="card">
				<div class="card-body">
					<h2 class="h5">Saved forms</h2>
					{#if data.forms.length === 0}<p class="text-muted mb-0">No forms added yet.</p>{:else}<ul
							class="list-group list-group-flush"
						>
							{#each data.forms as savedForm}<li
									class="list-group-item px-0 d-flex justify-content-between"
								>
									<span>{savedForm.name}</span><span class="text-muted small"
										>{(savedForm.definition as FormDefinition).fields.length} fields</span
									>
								</li>{/each}
						</ul>{/if}
				</div>
			</div>
		</div>
	</div>
</div>
