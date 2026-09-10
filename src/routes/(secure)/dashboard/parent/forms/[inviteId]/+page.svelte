<script lang="ts">
	import "@team4909/bionic-sign/styles.css";
	import { PdfFormFiller, type FormSubmission } from "@team4909/bionic-sign";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";
	let { data, form }: PageProps = $props();
	let filler = $state<{ submit: () => Promise<FormSubmission> }>();
	let values = $state("{}");
	let submitting = $state(false);
	async function sign() {
		if (!filler) return;
		submitting = true;
		try {
			values = JSON.stringify((await filler.submit()).values);
			(document.getElementById("parent-submit") as HTMLFormElement).requestSubmit();
		} catch {
			submitting = false;
		}
	}
</script>

<svelte:head><title>Parent Signature | {data.event.name}</title></svelte:head>
<div class="container py-4" style="max-width: 1100px;">
	<a href="/dashboard/parent">← Parent Dashboard</a>
	<h1 class="h2 mt-3">Parent signature</h1>
	<p class="text-muted">{data.student.firstName} {data.student.lastName} · {data.event.name}</p>
	{#if form?.message}<div class="alert alert-danger">{form.message}</div>{/if}
	<div class="bionic-sign">
		<PdfFormFiller
			bind:this={filler}
			source="/dashboard/parent/forms/{data.inviteId}/base"
			definition={data.definition}
		/>
	</div>
	<form
		id="parent-submit"
		method="post"
		action="?/submit"
		use:enhance={() =>
			({ update }) => {
				update().finally(() => (submitting = false));
			}}
	>
		<input type="hidden" name="values" value={values} />
		<button type="button" class="btn btn-primary mt-3" onclick={sign} disabled={submitting}
			>{submitting ? "Saving…" : "Sign and submit"}</button
		>
	</form>
</div>
