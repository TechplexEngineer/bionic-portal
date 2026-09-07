<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let updating = $state(false);
	let showManualRegister = $state(false);
	let registrationSearch = $state("");
	let registrationFilter = $state("");
	let filteredRegistrations = $derived(
		data.registrations.filter((registration) => {
			const query = registrationSearch.trim().toLowerCase();
			const name = `${registration.student.firstName} ${registration.student.lastName}`;
			const status = registration.paid && registration.formCompleted ? "ready" : "missing";
			return (
				(!query || `${name} ${registration.student.userid}`.toLowerCase().includes(query)) &&
				(!registrationFilter || status === registrationFilter)
			);
		})
	);
	let dietaryRegistrations = $derived(
		filteredRegistrations.filter((r) => r.student.dietaryRestrictions || r.student.intoleranceLevel)
	);
</script>

<svelte:head>
	<title>Registrations | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="display-6 fw-bold mb-0">Registrations</h1>
			<p class="text-muted mb-0">{data.event.name} • {data.event.startDate}</p>
		</div>
		<div class="d-flex gap-2">
			<a href="/admin/events/{data.event.id}/registrations/roster" class="btn btn-outline-success"
				><i class="fa fa-download me-1"></i> Roster CSV</a
			>
			<a href="/admin/events/{data.event.id}/registrations/forms" class="btn btn-outline-success"
				><i class="fa fa-file-pdf me-1"></i> Signed Forms ZIP</a
			>
			<a href="/admin/events/{data.event.id}/forms" class="btn btn-outline-primary"
				><i class="fa fa-pencil me-1"></i> Forms</a
			>
			{#if data.registrations.some((r) => !r.invoiceId)}
				<form
					method="post"
					action="?/createAllInvoices"
					use:enhance={() => {
						updating = true;
						return async ({ update }) => {
							await update();
							updating = false;
						};
					}}
				>
					<button type="submit" class="btn btn-outline-primary" disabled={updating}>
						<i class="fa fa-file-invoice-dollar me-1"></i> Create All Missing Invoices
					</button>
				</form>
			{/if}
			<button
				class="btn btn-outline-primary"
				onclick={() => (showManualRegister = !showManualRegister)}
			>
				<i class="fa fa-user-plus me-1"></i> Manual Register
			</button>
			<a href="/admin/events/{data.event.id}/mail" class="btn btn-outline-primary">
				<i class="fa fa-envelope me-1"></i> Mail Merge
			</a>
			<a href="/admin/events/{data.event.id}/registrations/import" class="btn btn-primary">
				<i class="fa fa-upload me-1"></i> Import
			</a>
			<a href="/admin/events" class="btn btn-outline-secondary">Back</a>
		</div>
	</header>

	{#if showManualRegister}
		<div class="card shadow-sm border-0 mb-4 bg-light">
			<div class="card-body">
				<h5 class="card-title h6 fw-bold mb-3">Manually Register Student</h5>
				<form
					method="POST"
					action="?/manualRegister"
					use:enhance={() => {
						updating = true;
						return async ({ update, result }) => {
							await update();
							updating = false;
							if (result.type === "success") {
								showManualRegister = false;
							}
						};
					}}
					class="row g-3 align-items-end"
				>
					<div class="col-md-6">
						<label for="studentId" class="form-label small text-muted">Select Student</label>
						<select name="studentId" id="studentId" class="form-select" required>
							<option value="">-- Choose a student --</option>
							{#each data.unregisteredStudents as student}
								<option value={student.userid}>
									{student.lastName}, {student.firstName} ({student.userid})
								</option>
							{/each}
						</select>
					</div>
					<div class="col-md-auto">
						<button
							type="submit"
							class="btn btn-primary"
							disabled={updating || data.unregisteredStudents.length === 0}
						>
							Register Student
						</button>
						<button
							type="button"
							class="btn btn-link link-secondary"
							onclick={() => (showManualRegister = false)}>Cancel</button
						>
					</div>
					{#if data.unregisteredStudents.length === 0}
						<div class="col-12">
							<p class="text-info small mb-0">
								<i class="fa fa-info-circle me-1"></i> All active students are already registered for
								this event.
							</p>
						</div>
					{/if}
				</form>
			</div>
		</div>
	{/if}
	{#if data.registrationClosed}
		<div class="alert alert-warning">
			<i class="fa fa-clock me-2"></i>Registration is closed. The admin-only manual registration
			tool above remains available for late additions.
		</div>
	{/if}

	<div class="row g-3 mb-4">
		<div class="col-md-3">
			<div class="card shadow-sm border-0 border-top border-primary border-4">
				<div class="card-body text-center py-3">
					<p class="text-muted small text-uppercase fw-bold mb-1">Registered</p>
					<h3 class="mb-0 fw-bold">{data.totals.registered}</h3>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow-sm border-0 border-top border-success border-4">
				<div class="card-body text-center py-3">
					<p class="text-muted small text-uppercase fw-bold mb-1">Paid</p>
					<h3 class="mb-0 fw-bold">{data.totals.paid}</h3>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow-sm border-0 border-top border-info border-4">
				<div class="card-body text-center py-3">
					<p class="text-muted small text-uppercase fw-bold mb-1">Forms Complete</p>
					<h3 class="mb-0 fw-bold">{data.totals.formsCompleted}</h3>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow-sm border-0 border-top border-warning border-4">
				<div class="card-body text-center py-3">
					<p class="text-muted small text-uppercase fw-bold mb-1">Event Ready</p>
					<h3 class="mb-0 fw-bold text-success">{data.totals.eventReady}</h3>
				</div>
			</div>
		</div>
	</div>

	{#if form?.message}
		<div class="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
			<i class="fa fa-exclamation-triangle me-2"></i>
			{form.message}
			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
		</div>
	{/if}

	<main>
		{#if data.registrations.length === 0}
			<div class="text-center py-5 bg-light rounded border border-2 border-dashed">
				<i class="fa fa-users fa-4x text-muted opacity-25 mb-3"></i>
				<p class="lead text-muted">No registrations yet for this event.</p>
			</div>
		{:else}
			<div class="d-flex flex-wrap gap-2 align-items-end mb-3">
				<div class="flex-grow-1">
					<label class="form-label mb-1" for="registration-search">Search</label>
					<input
						id="registration-search"
						class="form-control"
						type="search"
						placeholder="Search students or email..."
						bind:value={registrationSearch}
					/>
				</div>
				<div>
					<label class="form-label mb-1" for="registration-filter">Filter Status</label>
					<select id="registration-filter" class="form-select" bind:value={registrationFilter}>
						<option value="">All statuses</option>
						<option value="ready">Ready</option>
						<option value="missing">Missing</option>
					</select>
				</div>
			</div>
			<div class="card shadow-sm border-0">
				<div class="table-responsive">
					<table class="table table-hover align-middle mb-0">
						<thead class="table-light">
							<tr>
								<th class="ps-4">Student Name</th>
								<th>Email</th>
								<th>Payment</th>
								<th>Forms</th>
								<th>Invoicing</th>
								<th class="pe-4 text-end">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredRegistrations as reg (reg.id)}
								<tr>
									<td class="ps-4"
										><strong>{reg.student.firstName} {reg.student.lastName}</strong></td
									>
									<td class="text-muted small">{reg.student.userid}</td>
									<td>
										<form
											method="post"
											action="?/togglePaid"
											use:enhance={() => {
												updating = true;
												return async ({ update }) => {
													await update();
													updating = false;
												};
											}}
										>
											<input type="hidden" name="id" value={reg.id} />
											<input type="hidden" name="paid" value={reg.paid} />
											<button
												type="submit"
												class="btn btn-sm rounded-pill px-3 {reg.paid
													? 'btn-success-subtle text-success border-success-subtle'
													: 'btn-danger-subtle text-danger border-danger-subtle'} fw-bold"
												disabled={updating}
												style="font-size: 0.7rem;"
											>
												{reg.paid ? "PAID" : "UNPAID"}
											</button>
										</form>
									</td>
									<td>
										{#if data.forms.length > 0}
											<div class="d-flex flex-column gap-1">
												{#each data.forms as eventForm}
													{@const status = data.formsByRegistration[reg.id]?.find(
														(item) => item.id === eventForm.id
													)}
													<span class="small {status?.completed ? 'text-success' : 'text-warning'}"
														>{status?.completed ? "✓" : "○"} {eventForm.name}</span
													>
												{/each}
											</div>
										{:else}
											<form
												method="post"
												action="?/toggleForm"
												use:enhance={() => {
													updating = true;
													return async ({ update }) => {
														await update();
														updating = false;
													};
												}}
											>
												<input type="hidden" name="id" value={reg.id} />
												<input type="hidden" name="formCompleted" value={reg.formCompleted} />
												<button
													type="submit"
													class="btn btn-sm rounded-pill px-3 {reg.formCompleted
														? 'btn-info-subtle text-info border-info-subtle'
														: 'btn-warning-subtle text-warning border-warning-subtle'} fw-bold"
													disabled={updating}
													style="font-size: 0.7rem;"
													>{reg.formCompleted ? "DONE" : "PENDING"}</button
												>
											</form>
										{/if}
									</td>
									<td>
										{#if reg.invoiceId}
											{#if reg.invoicePaymentLink}
												<a
													href={reg.invoicePaymentLink}
													target="_blank"
													class="badge bg-light text-dark border fw-normal py-2 px-3 text-decoration-none"
													title="Open QuickBooks Invoice"
												>
													<i class="fa fa-file-invoice me-1 text-primary"></i>
													{reg.invoiceId}
													<i class="fa fa-external-link-alt ms-1 small text-muted"></i>
												</a>
											{:else}
												<span class="badge bg-light text-dark border fw-normal py-2 px-3">
													<i class="fa fa-file-invoice me-1 text-primary"></i>
													{reg.invoiceId}
												</span>
											{/if}
										{:else}
											<form
												method="post"
												action="?/createInvoice"
												use:enhance={() => {
													updating = true;
													return async ({ update }) => {
														await update();
														updating = false;
													};
												}}
											>
												<input type="hidden" name="id" value={reg.id} />
												<input type="hidden" name="studentEmail" value={reg.student.userid} />
												<button
													type="submit"
													class="btn btn-outline-primary btn-sm"
													disabled={updating}
												>
													Create QB Invoice
												</button>
											</form>
										{/if}
									</td>
									<td class="pe-4 text-end">
										{#if reg.paid && reg.formCompleted}
											<span class="text-success fw-bold small">
												<i class="fa fa-check-circle me-1"></i> Ready
											</span>
										{:else}
											<span class="text-danger fw-bold small">
												<i class="fa fa-times-circle me-1"></i> Missing
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Dietary Restrictions Summary -->
		{#if dietaryRegistrations.length > 0}
			<div class="card shadow-sm border-0 mt-4">
				<div class="card-header bg-danger bg-opacity-10">
					<h5 class="fw-bold mb-0 text-danger">
						<i class="fa fa-heartbeat me-2"></i>Dietary Restrictions &amp; Allergies
					</h5>
				</div>
				<div class="card-body p-0">
					<table class="table table-hover mb-0">
						<thead class="table-light">
							<tr>
								<th class="ps-4">Student</th>
								<th>Restrictions</th>
								<th>Severity</th>
							</tr>
						</thead>
						<tbody>
							{#each dietaryRegistrations as reg (reg.id)}
								<tr>
									<td class="ps-4 fw-semibold">
										{reg.student.firstName}
										{reg.student.lastName}
									</td>
									<td>{reg.student.dietaryRestrictions ?? "—"}</td>
									<td>
										{#if reg.student.intoleranceLevel === "cannot_have"}
											<span class="badge bg-danger">
												<i class="fa fa-exclamation-circle me-1"></i>Cannot have — carries epi-pen
											</span>
										{:else if reg.student.intoleranceLevel === "epi_pen"}
											<span class="badge bg-warning text-dark">
												<i class="fa fa-medkit me-1"></i>Carries epi-pen
											</span>
										{:else if reg.student.intoleranceLevel === "prefer_not"}
											<span class="badge bg-secondary">
												<i class="fa fa-minus-circle me-1"></i>Prefers not to eat
											</span>
										{:else if reg.student.intoleranceLevel}
											<span class="badge bg-light text-dark border"
												>{reg.student.intoleranceLevel}</span
											>
										{:else}
											<span class="text-muted">—</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.btn-success-subtle {
		background-color: var(--bs-success-bg-subtle);
	}
	.btn-danger-subtle {
		background-color: var(--bs-danger-bg-subtle);
	}
	.btn-info-subtle {
		background-color: var(--bs-info-bg-subtle);
	}
	.btn-warning-subtle {
		background-color: var(--bs-warning-bg-subtle);
	}

	.border-dashed {
		border-style: dashed !important;
	}
</style>
