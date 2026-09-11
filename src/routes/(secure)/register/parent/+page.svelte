<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Parent Registration | Bionic Portal</title>
</svelte:head>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card shadow-sm border-0">
				<div class="card-body p-4">
					<h1 class="h2 card-title fw-bold mb-2">Parent Registration</h1>
					<p class="text-body-secondary mb-4">Signed in as {data.user.username}</p>
					<p class="text-secondary mb-4">
						Enter your student's school email address to link their account to yours. Once
						connected, you can manage registrations and view attendance. You can connect multiple
						students by submitting this form more than once.
					</p>

					{#if form?.message}
						<div class="alert {form.success ? 'alert-success' : 'alert-danger'} mb-4" role="alert">
							{form.message}
						</div>
					{/if}

					<form
						method="POST"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}
					>
						{#if !data.hasProfile}
							<div class="mb-4">
								<label for="phone" class="form-label fw-semibold">
									Your Phone Number <span class="text-danger">*</span>
								</label>
								<div class="input-group">
									<span class="input-group-text bg-white border-end-0">
										<i class="fa fa-phone text-muted"></i>
									</span>
									<input
										type="tel"
										class="form-control border-start-0 ps-0"
										id="phone"
										name="phone"
										placeholder="(555) 555-5555"
										value={data.profile?.phone ?? ""}
										required
									/>
								</div>
							</div>
						{:else}
							<!-- Show existing phone with option to update -->
							<div class="mb-4">
								<label for="phone" class="form-label fw-semibold">Your Phone Number</label>
								<div class="input-group">
									<span class="input-group-text bg-white border-end-0">
										<i class="fa fa-phone text-muted"></i>
									</span>
									<input
										type="tel"
										class="form-control border-start-0 ps-0"
										id="phone"
										name="phone"
										placeholder="(555) 555-5555"
										value={data.profile?.phone ?? ""}
									/>
								</div>
							</div>
						{/if}

						<div class="mb-4">
							<label for="educationLevel" class="form-label fw-semibold"
								>Level of Education <span class="text-danger">*</span></label
							>
							<input
								id="educationLevel"
								name="educationLevel"
								class="form-control"
								value={data.profile?.educationLevel ?? ""}
								required
							/>
						</div>
						<div class="row g-3 mb-4">
							<div class="col-md-6">
								<label for="degree" class="form-label fw-semibold"
									>Degree <span class="text-danger">*</span></label
								>
								<input
									id="degree"
									name="degree"
									class="form-control"
									value={data.profile?.degree ?? ""}
									required
								/>
							</div>
							<div class="col-md-6">
								<label for="jobTitle" class="form-label fw-semibold"
									>Job Title <span class="text-danger">*</span></label
								>
								<input
									id="jobTitle"
									name="jobTitle"
									class="form-control"
									value={data.profile?.jobTitle ?? ""}
									required
								/>
							</div>
						</div>

						<div class="mb-4">
							<label for="studentEmail" class="form-label fw-semibold">
								Student School Email {#if !data.hasProfile}<span class="text-danger">*</span>{/if}
							</label>
							<div class="input-group">
								<span class="input-group-text bg-white border-end-0">
									<i class="fa fa-envelope text-muted"></i>
								</span>
								<input
									type="email"
									class="form-control border-start-0 ps-0"
									id="studentEmail"
									name="studentEmail"
									placeholder="student@billericak12.com"
									required={!data.hasProfile}
								/>
							</div>
							<div class="form-text mt-2">
								Your student must have already completed their student registration with this email.
								Homeschool students can use the personal email on their student profile.
							</div>
						</div>

						<div class="d-grid">
							<button type="submit" class="btn btn-primary py-2 fw-bold" disabled={loading}>
								{#if loading}
									<span
										class="spinner-border spinner-border-sm me-2"
										role="status"
										aria-hidden="true"
									></span>
									Connecting...
								{:else}
									Connect to Student
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>

			{#if data.linkedStudents && data.linkedStudents.length > 0}
				<div class="mt-5">
					<h4 class="fw-bold mb-3">Linked Students</h4>
					<div class="list-group shadow-sm">
						{#each data.linkedStudents as s (s.userid)}
							<div class="list-group-item d-flex justify-content-between align-items-center py-3">
								<div>
									<div class="fw-semibold">{s.firstName} {s.lastName}</div>
									<div class="small text-muted">{s.userid}</div>
								</div>
								<span class="badge bg-success rounded-pill">Active</span>
							</div>
						{/each}
					</div>
					<div class="mt-3">
						<a href={resolve("/dashboard")} class="btn btn-outline-primary w-100">
							<i class="fa fa-tachometer me-1"></i> Go to Dashboard
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.input-group-text {
		border-right: none;
	}
	.form-control:focus {
		box-shadow: none;
		border-color: #dee2e6;
	}
</style>
