<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Edit Student | Admin | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<h1 class="h2 mb-0">Edit Student</h1>
		<a href="/admin/students" class="btn btn-outline-secondary btn-sm">Back to Students</a>
	</header>

	<form
		method="post"
		class="card card-body shadow-sm"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<div class="row g-3">
			{#each data.fields as field (field.key)}
				<div class={field.inputType === "checkbox" ? "col-12" : "col-md-6"}>
					{#if field.inputType === "checkbox"}
						<div class="form-check form-switch mt-2">
							<input
								class="form-check-input"
								type="checkbox"
								id={field.key}
								name={field.key}
								checked={data.student[field.key as keyof typeof data.student] === true}
							/>
							<label class="form-check-label" for={field.key}>{field.label}</label>
						</div>
					{:else}
						<label class="form-label" for={field.key}>{field.label}</label>
						<input
							class="form-control"
							type={field.inputType}
							id={field.key}
							name={field.key}
							value={data.student[field.key as keyof typeof data.student] ?? ""}
							required={field.required}
						/>
					{/if}
				</div>
			{/each}
		</div>

		{#if form?.message}
			<div class="alert alert-danger mt-4 mb-0">{form.message}</div>
		{/if}

		<div class="d-flex justify-content-end mt-4 pt-3 border-top">
			<button type="submit" class="btn btn-primary" disabled={submitting}>
				{#if submitting}Saving...{:else}Save Changes{/if}
			</button>
		</div>
	</form>
</div>
