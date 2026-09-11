<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	const shirtSizes = ["YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"];
</script>

<svelte:head>
	<title>Mentor Registration | Bionic Portal</title>
</svelte:head>

<main class="container py-5">
	<div class="row justify-content-center">
		<div class="col-12 col-lg-8">
			<div class="card shadow-sm border-0">
				<div class="card-body p-4 p-md-5">
					<h1 class="h2 mb-2">Mentor Registration</h1>
					<p class="text-body-secondary mb-4">
						Tell us a little about yourself and how you can support Team 4909.
					</p>

					{#if form?.message}
						<div class="alert alert-danger" role="alert">
							{form.message}
						</div>
					{/if}

					<form
						method="POST"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								try {
									await update({ reset: false });
								} finally {
									submitting = false;
								}
							};
						}}
					>
						<div class="row g-3 mb-4">
							<div class="col-md-6">
								<label for="firstName" class="form-label"
									>First Name <span class="text-danger">*</span></label
								>
								<input
									id="firstName"
									name="firstName"
									class="form-control"
									value={data.profile?.firstName ?? ""}
									required
								/>
							</div>
							<div class="col-md-6">
								<label for="lastName" class="form-label"
									>Last Name <span class="text-danger">*</span></label
								>
								<input
									id="lastName"
									name="lastName"
									class="form-control"
									value={data.profile?.lastName ?? ""}
									required
								/>
							</div>
						</div>

						<div class="row g-3 mb-4">
							<div class="col-md-6">
								<label for="phone" class="form-label"
									>Phone Number <span class="text-danger">*</span></label
								>
								<input
									id="phone"
									name="phone"
									type="tel"
									class="form-control"
									placeholder="(555) 555-5555"
									value={data.profile?.phone ?? ""}
									required
								/>
							</div>
							<div class="col-md-6">
								<label for="company" class="form-label"
									>Company / Organization <span class="text-danger">*</span></label
								>
								<input
									id="company"
									name="company"
									class="form-control"
									value={data.profile?.company ?? ""}
									required
								/>
							</div>
						</div>

						<div class="row g-3 mb-4">
							<div class="col-md-6">
								<label for="tshirtSize" class="form-label"
									>Shirt Size <span class="text-danger">*</span></label
								>
								<select
									id="tshirtSize"
									name="tshirtSize"
									class="form-select"
									value={data.profile?.tshirtSize ?? ""}
									required
								>
									<option value="">Select a size</option>
									{#each shirtSizes as size (size)}<option value={size}>{size}</option>{/each}
								</select>
							</div>
							<div class="col-md-6">
								<label for="firstAlumni" class="form-label"
									>Are you a FIRST alumnus? <span class="text-danger">*</span></label
								>
								<select
									id="firstAlumni"
									name="firstAlumni"
									class="form-select"
									value={data.profile?.firstAlumni ?? ""}
									required
								>
									<option value="">Select one</option>
									<option value="yes">Yes</option>
									<option value="no">No</option>
								</select>
							</div>
						</div>

						<button type="submit" class="btn btn-primary" disabled={submitting}>
							{submitting ? "Saving…" : "Save Mentor Profile"}
						</button>
						<a href={resolve("/dashboard")} class="btn btn-outline-secondary ms-2">Cancel</a>
					</form>
				</div>
			</div>
		</div>
	</div>
</main>
