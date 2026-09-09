<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let firstName = $state(data.student?.firstName ?? "");
	let lastName = $state(data.student?.lastName ?? "");
	let dietaryRestrictions = $state(data.student?.dietaryRestrictions ?? "");
	let intoleranceLevel = $state(data.student?.intoleranceLevel ?? "");

	function parseParents() {
		const names = data.student?.parentNames ? data.student.parentNames.split(",") : [];
		const emails = data.student?.parentEmails ? data.student.parentEmails.split(",") : [];
		const phones = data.student?.parentPhone ? data.student.parentPhone.split(",") : [];
		const len = Math.max(names.length, emails.length, phones.length, 1);
		const result = [];
		for (let i = 0; i < len; i++) {
			result.push({
				name: names[i]?.trim() || "",
				email: emails[i]?.trim() || "",
				phone: phones[i]?.trim() || ""
			});
		}
		return result;
	}
	let parents = $state(parseParents());

	function addParent() {
		parents.push({ name: "", email: "", phone: "" });
	}

	function removeParent(index: number) {
		if (parents.length > 1) {
			parents.splice(index, 1);
		}
	}

	let graduationYear = $state(data.student?.graduationYear ?? "");
	let tshirtSize = $state(data.student?.tshirtSize ?? "");
	let currentGrade = $state(data.student?.currentGrade ?? "");
	let gender = $state(data.student?.gender ?? "");
	let dateOfBirth = $state(data.student?.dateOfBirth ?? "");

	let submitting = $state(false);

	const currentYear = new Date().getFullYear();
	const graduationYears = Array.from({ length: 8 }, (_, i) => currentYear + i);

	const tshirtSizes = ["YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"];
	const grades = ["8", "9", "10", "11", "12"];
	const genders = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];
</script>

<svelte:head>
	<title>Register Profile | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="text-center mb-4">
		<h1>Student Profile</h1>
		<p class="text-muted mb-0">Logged in as <strong>{data.email}</strong></p>
	</header>

	<main class="row justify-content-center">
		<div class="col-lg-8">
			<form
				method="post"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
				class="card border-0 shadow-sm"
			>
				<div class="card-body p-4">
					<div class="mb-5">
						<h2 class="h4 border-bottom pb-2 mb-3">Basic Information</h2>
						<div class="row g-3">
							<div class="col-md-6">
								<label for="firstName" class="form-label">First Name</label>
								<input
									type="text"
									id="firstName"
									name="firstName"
									bind:value={firstName}
									placeholder="First Name"
									class="form-control"
									required
								/>
							</div>
							<div class="col-md-6">
								<label for="lastName" class="form-label">Last Name</label>
								<input
									type="text"
									id="lastName"
									name="lastName"
									bind:value={lastName}
									placeholder="Last Name"
									class="form-control"
									required
								/>
							</div>
						</div>
						<div class="row g-3 mt-1">
							<div class="col-md-6">
								<label for="dateOfBirth" class="form-label"
									>Date of Birth <span class="text-danger">*</span></label
								>
								<input
									type="date"
									id="dateOfBirth"
									name="dateOfBirth"
									bind:value={dateOfBirth}
									class="form-control"
									max={new Date().toISOString().slice(0, 10)}
									required
								/>
							</div>
						</div>
						<div class="row g-3 mt-1">
							<div class="col-md-6">
								<label for="graduationYear" class="form-label"
									>Year of Graduation <span class="text-danger">*</span></label
								>
								<select
									class="form-select"
									id="graduationYear"
									name="graduationYear"
									bind:value={graduationYear}
									required
								>
									<option value="">-- Select Year --</option>
									{#each graduationYears as year}
										<option value={year}>{year}</option>
									{/each}
								</select>
							</div>
							<div class="col-md-6">
								<label for="tshirtSize" class="form-label"
									>T-Shirt Size <span class="text-danger">*</span></label
								>
								<select
									class="form-select"
									id="tshirtSize"
									name="tshirtSize"
									bind:value={tshirtSize}
									required
								>
									<option value="">-- Select Size --</option>
									{#each tshirtSizes as size}
										<option value={size}>{size}</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="row g-3 mt-1">
							<div class="col-md-6">
								<label for="currentGrade" class="form-label"
									>Current Grade <span class="text-danger">*</span></label
								>
								<select
									class="form-select"
									id="currentGrade"
									name="currentGrade"
									bind:value={currentGrade}
									required
								>
									<option value="">-- Select Grade --</option>
									{#each grades as grade}
										<option value={grade}>{grade}</option>
									{/each}
								</select>
							</div>
							<div class="col-md-6">
								<label for="gender" class="form-label"
									>Gender <span class="text-danger">*</span></label
								>
								<select class="form-select" id="gender" name="gender" bind:value={gender} required>
									<option value="">-- Select Gender --</option>
									{#each genders as g}
										<option value={g}>{g}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<div class="mb-5">
						<h2 class="h4 border-bottom pb-2 mb-3">Contact Information</h2>
						<div class="mt-4">
							{#each parents as parent, idx}
								<div class="mb-4">
									<div class="d-flex justify-content-between align-items-center mb-2">
										<div class="form-label mb-0">
											Parent/Guardian {idx + 1} <span class="text-danger">*</span>
										</div>
										<div>
											{#if parents.length > 1}
												<button
													type="button"
													class="btn btn-outline-danger btn-sm me-2"
													onclick={() => removeParent(idx)}
												>
													<i class="fa fa-times"></i> Remove
												</button>
											{/if}
											{#if idx === parents.length - 1}
												<button
													type="button"
													class="btn btn-outline-secondary btn-sm"
													onclick={addParent}
												>
													<i class="fa fa-plus"></i> Add Another
												</button>
											{/if}
										</div>
									</div>
									<div class="row g-2">
										<div class="col-md-4">
											<input
												type="text"
												class="form-control"
												name="parentNames"
												bind:value={parent.name}
												placeholder="Name"
												required={idx === 0}
											/>
										</div>
										<div class="col-md-4">
											<input
												type="email"
												class="form-control"
												name="parentEmails"
												bind:value={parent.email}
												placeholder="Email"
												required={idx === 0}
											/>
										</div>
										<div class="col-md-4">
											<input
												type="tel"
												class="form-control"
												name="parentPhones"
												bind:value={parent.phone}
												placeholder="Phone Number"
												required={idx === 0}
											/>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="mb-5">
						<h2 class="h4 border-bottom pb-2 mb-3">Health &amp; Dietary</h2>
						<div class="mb-3">
							<label for="dietaryRestrictions" class="form-label">Dietary Restrictions</label>
							<textarea
								id="dietaryRestrictions"
								name="dietaryRestrictions"
								bind:value={dietaryRestrictions}
								class="form-control"
								rows="3"
								placeholder="e.g. Peanut allergy, Vegetarian, Gluten-free, etc."
							></textarea>
						</div>
						<fieldset class="mb-3 border-0 p-0">
							<legend class="form-label fs-6">
								Level of Dietary Intolerance <span class="text-danger">*</span>
							</legend>
							<div class="d-flex flex-column gap-2">
								<label class="form-check">
									<input
										type="radio"
										class="form-check-input"
										name="intoleranceLevel"
										value="cannot_have"
										checked={intoleranceLevel === "cannot_have"}
										onchange={() => (intoleranceLevel = "cannot_have")}
										required
									/>
									<span class="form-check-label"
										><strong>Severe:</strong> Cannot have any — life-threatening allergy, always carry
										epi-pen</span
									>
								</label>
								<label class="form-check">
									<input
										type="radio"
										class="form-check-input"
										name="intoleranceLevel"
										value="epi_pen"
										checked={intoleranceLevel === "epi_pen"}
										onchange={() => (intoleranceLevel = "epi_pen")}
									/>
									<span class="form-check-label"
										><strong>Moderate:</strong> Carry epi-pen as precaution, can manage in most situations</span
									>
								</label>
								<label class="form-check">
									<input
										type="radio"
										class="form-check-input"
										name="intoleranceLevel"
										value="prefer_not"
										checked={intoleranceLevel === "prefer_not"}
										onchange={() => (intoleranceLevel = "prefer_not")}
									/>
									<span class="form-check-label"
										><strong>Mild:</strong> Prefer not to eat — no severe reaction</span
									>
								</label>
								<label class="form-check">
									<input
										type="radio"
										class="form-check-input"
										name="intoleranceLevel"
										value="none"
										checked={intoleranceLevel === "none"}
										onchange={() => (intoleranceLevel = "none")}
									/>
									<span class="form-check-label">No dietary restrictions</span>
								</label>
							</div>
						</fieldset>
					</div>

					{#if data.student?.customFields && Object.keys(data.student.customFields).length > 0}
						<div class="mb-5">
							<h2 class="h4 border-bottom pb-2 mb-3">Additional Questions</h2>
							{#each Object.entries(data.student.customFields) as [key, value]}
								<div class="mb-3">
									<label for="custom_{key}" class="form-label">{key}</label>
									<input
										type="text"
										id="custom_{key}"
										name="custom_{key}"
										class="form-control"
										{value}
										placeholder="Enter your answer"
									/>
								</div>
							{/each}
						</div>
					{/if}

					{#if form?.message}
						<div class="alert alert-{form.success ? 'success' : 'danger'} mb-3">
							{form.message}
						</div>
					{/if}

					<div class="d-grid">
						<button type="submit" class="btn btn-primary" disabled={submitting}>
							{#if submitting}
								<i class="fa fa-spinner fa-pulse me-2"></i> Saving...
							{:else}
								Save Profile
							{/if}
						</button>
					</div>
				</div>
			</form>
		</div>
	</main>
</div>
