<script lang="ts">
	import "bionic-sign/styles.css";
	import { PdfFormFiller, type FormDefinition, type FormSubmission } from "bionic-sign";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let filler = $state<{ submit: () => Promise<FormSubmission> }>();
	let values = $state("");
	let pdf = $state<Uint8Array>();
	let submitting = $state(false);
	let errorMessage = $state("");
	let fileInput = $state<HTMLInputElement>();

	async function complete() {
		if (!filler) return;
		submitting = true;
		errorMessage = "";
		try {
			const submission = await filler.submit();
			values = JSON.stringify(submission.values);
			pdf = submission.pdf;
			const transfer = new DataTransfer();
			transfer.items.add(
				new File([submission.pdf.slice().buffer], "signed.pdf", { type: "application/pdf" })
			);
			if (fileInput) fileInput.files = transfer.files;
			(document.getElementById("submission") as HTMLFormElement).requestSubmit();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : "Please complete all required fields.";
			submitting = false;
		}
	}
</script>

<svelte:head><title>{data.form.name} | {data.event.name} | Bionic Portal</title></svelte:head>
<div class="container py-4" style="max-width: 1100px;">
	<header class="mb-4">
		<a href="/dashboard" class="text-decoration-none">← Dashboard</a>
		<h1 class="h2 mt-3">{data.form.name}</h1>
		<p class="text-muted">{data.event.name} · Complete and submit this form.</p>
	</header>
	{#if form?.message}<div class="alert alert-danger">{form.message}</div>{/if}
	{#if data.completed}<div class="alert alert-success">
			This form has been submitted. You may submit an updated version if needed.
		</div>{/if}
	{#if errorMessage}<div class="alert alert-danger" role="alert">{errorMessage}</div>{/if}
	<div class="bionic-sign">
		<PdfFormFiller
			bind:this={filler}
			source="/dashboard/forms/{data.registrationId}/{data.formId}/base"
			definition={data.form.definition as FormDefinition}
			prefill={{ student_name: `${data.student.firstName} ${data.student.lastName}` }}
		/>
	</div>
	<form
		id="submission"
		method="post"
		action="?/submit"
		enctype="multipart/form-data"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="values" value={values} />
		<input bind:this={fileInput} type="file" name="pdf" class="d-none" accept="application/pdf" />
		<button class="btn btn-primary mt-3" type="button" onclick={complete} disabled={submitting}
			>{submitting ? "Saving…" : "Submit completed form"}</button
		>
	</form>
</div>
