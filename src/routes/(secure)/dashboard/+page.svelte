<script lang="ts">
	import DashHeader, { type Page } from "$lib/components/DashHeader.svelte";
	import { hasPendingActionItems } from "$lib/profileActions";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let navPages: Page[] = [
		{
			name: "Dashboard",
			route: "/dashboard",
			nested: [
				{
					name: "Overview",
					route: "/dashboard"
				}
			]
		}
	];

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		});
	}
</script>

<svelte:head>
	<title>Dashboard | Bionic Portal</title>
</svelte:head>

<div class="container">
	<DashHeader pages={navPages} />

	{#if data.role === "parent"}
		<!-- ===== PARENT DASHBOARD ===== -->
		<div class="dashboard-header">
			<h2>Parent Dashboard</h2>
			<a href="/register/parent" class="btn btn-outline-primary btn-sm">
				<i class="fa fa-link me-1"></i> Link a Student
			</a>
		</div>

		{#if data.studentsWithRegs.length === 0}
			<div class="alert alert-info">
				You have no linked students yet.
				<a href="/register/parent" class="alert-link">Link a student</a> to get started.
			</div>
		{:else}
			{#each data.studentsWithRegs as { student, registrations }}
				<div class="card mb-4 shadow-sm">
					<div class="card-header d-flex justify-content-between align-items-center">
						<h5 class="mb-0 fw-bold">
							{student.firstName}
							{student.lastName}
						</h5>
						<small class="text-muted">{student.userid}</small>
					</div>
					<div class="card-body">
						{#if registrations.length === 0}
							<p class="text-muted mb-0">No event registrations yet.</p>
						{:else}
							<!-- Action items -->
							{@const pending = registrations.filter((r) => !r.paid || !r.formCompleted)}
							{#if pending.length > 0}
								<h6 class="text-warning fw-bold mb-2">
									<i class="fa fa-exclamation-triangle me-1"></i> Action Items
								</h6>
								<ul class="list-group mb-3">
									{#each pending as reg}
										<li
											class="list-group-item d-flex justify-content-between align-items-center py-2"
										>
											<span>{reg.eventName} — {formatDate(reg.startDate)}</span>
											<span class="d-flex gap-2">
												{#if !reg.formCompleted}
													<span class="badge bg-danger">Form Incomplete</span>
												{/if}
												{#if !reg.paid}
													<span class="badge bg-warning text-dark">Payment Pending</span>
												{/if}
											</span>
										</li>
									{/each}
								</ul>
							{/if}

							<!-- Registered events -->
							<h6 class="fw-bold mb-2">
								<i class="fa fa-calendar me-1"></i> Registered Events
							</h6>
							<ul class="list-group">
								{#each registrations as reg}
									<li class="list-group-item py-2">
										<div class="d-flex justify-content-between align-items-center">
											<span class="fw-semibold">{reg.eventName}</span>
											<span class="d-flex gap-1">
												<span
													class="badge {reg.formCompleted ? 'bg-success' : 'bg-secondary'}"
													title="Form"
												>
													<i class="fa fa-file-text me-1"></i>
													{reg.formCompleted ? "Form ✓" : "Form Pending"}
												</span>
												<span
													class="badge {reg.paid ? 'bg-success' : 'bg-warning text-dark'}"
													title="Payment"
												>
													<i class="fa fa-dollar me-1"></i>
													{reg.paid ? "Paid ✓" : "Unpaid"}
												</span>
											</span>
										</div>
										<small class="text-muted"
											>{formatDate(reg.startDate)} – {formatDate(reg.endDate)}</small
										>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	{:else}
		<!-- ===== STUDENT DASHBOARD ===== -->
		<div class="row g-4 mt-1">
			<!-- Widget 1: Action Items -->
			<div class="col-md-6">
				<div class="card h-100 shadow-sm">
					<div class="card-header bg-warning bg-opacity-10 d-flex align-items-center gap-2">
						<i class="fa fa-exclamation-circle text-warning"></i>
						<h5 class="mb-0 fw-bold">Action Items</h5>
					</div>
					<div class="card-body">
						{#if data.profileCompleteness.incomplete}
							<a
								href={`${data.profileCompleteness.href}?returnTo=${encodeURIComponent("/dashboard")}`}
								class="alert alert-danger d-block text-decoration-none"
							>
								<i class="fa fa-user me-2"></i>
								<strong>Complete your profile</strong>
								<div class="small mt-1">
									Missing: {data.profileCompleteness.missingFields.join(", ")}
								</div>
							</a>
						{/if}
						{#if !hasPendingActionItems(data.profileCompleteness.incomplete, data.actionItems.length)}
							<div class="text-muted text-center py-3">
								<i class="fa fa-check-circle fa-2x mb-2 text-success d-block"></i>
								You're all caught up! No pending tasks.
							</div>
						{:else}
							<ul class="list-group list-group-flush">
								{#each data.actionItems as item}
									<li class="list-group-item px-0">
										<div class="fw-semibold">{item.eventName}</div>
										<small class="text-muted">{formatDate(item.startDate)}</small>
										<div class="d-flex gap-2 mt-1 flex-wrap">
											{#each item.forms.filter((eventForm) => !eventForm.completed) as eventForm}
												<a
													href="/dashboard/forms/{item.id}/{eventForm.id}"
													class="badge bg-danger text-decoration-none"
													><i class="fa fa-file-text me-1"></i> Complete {eventForm.name}</a
												>
											{/each}
											{#if !item.formCompleted}
												{#if item.permissionFormUrl}
													<a
														href={item.permissionFormUrl}
														target="_blank"
														class="badge bg-danger text-decoration-none"
													>
														<i class="fa fa-file-text me-1"></i> Complete Permission Form
													</a>
												{:else}
													<span class="badge bg-secondary">
														<i class="fa fa-file-text me-1"></i> Form Pending
													</span>
												{/if}
											{/if}
											{#if !item.paid}
												{#if item.invoicePaymentLink}
													<a
														href={item.invoicePaymentLink}
														target="_blank"
														class="badge bg-warning text-dark text-decoration-none"
													>
														<i class="fa fa-credit-card me-1"></i> Pay Now
													</a>
												{:else}
													<span class="badge bg-warning text-dark">
														<i class="fa fa-dollar me-1"></i> Payment Pending
													</span>
												{/if}
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			</div>

			<!-- Widget 2: Registered Events -->
			<div class="col-md-6">
				<div class="card h-100 shadow-sm">
					<div
						class="card-header d-flex justify-content-between align-items-center bg-primary bg-opacity-10"
					>
						<div class="d-flex align-items-center gap-2">
							<i class="fa fa-calendar text-primary"></i>
							<h5 class="mb-0 fw-bold">My Events</h5>
						</div>
						<a href="/compete" class="btn btn-primary btn-sm">
							<i class="fa fa-plus me-1"></i> Register for an Event
						</a>
					</div>
					<div class="card-body">
						{#if data.upcomingRegistrations.length === 0}
							<div class="text-muted text-center py-3">
								<i class="fa fa-calendar-o fa-2x mb-2 d-block"></i>
								No upcoming events. <a href="/compete">Browse open events</a>.
							</div>
						{:else}
							<ul class="list-group list-group-flush">
								{#each data.upcomingRegistrations as reg}
									<li class="list-group-item px-0">
										<div class="d-flex justify-content-between align-items-start">
											<div>
												<div class="fw-semibold">{reg.eventName}</div>
												<small class="text-muted"
													>{formatDate(reg.startDate)} – {formatDate(reg.endDate)}</small
												>
											</div>
											{#each reg.forms as eventForm}
												{#if !eventForm.completed}<a
														href="/dashboard/forms/{reg.id}/{eventForm.id}"
														class="btn btn-sm btn-outline-primary mt-2">Complete {eventForm.name}</a
													>{/if}
											{/each}
											<div class="d-flex gap-1 flex-wrap justify-content-end">
												<span class="badge {reg.formCompleted ? 'bg-success' : 'bg-secondary'}">
													{reg.formCompleted ? "Form ✓" : "Form Pending"}
												</span>
												<span class="badge {reg.paid ? 'bg-success' : 'bg-warning text-dark'}">
													{reg.paid ? "Paid ✓" : "Unpaid"}
												</span>
											</div>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<section class="mt-4 mb-4" aria-labelledby="dashboard-calendar-heading">
		<h2 id="dashboard-calendar-heading">Calendar</h2>
		<div class="ratio ratio-16x9">
			<iframe
				title="Team 4909 Calendar"
				src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FNew_York&title=Team%204909&showTz=0&showCalendars=0&src=dGVhbTQ5MDlAZ21haWwuY29t&color=%230b8043"
				frameborder="0"
				scrolling="no"
			></iframe>
		</div>
	</section>
</div>

<style>
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-top: 0.5rem;
	}

	.dashboard-header h2 {
		font-weight: 800;
		margin: 0;
	}

	.card-header {
		font-size: 0.95rem;
	}
</style>
