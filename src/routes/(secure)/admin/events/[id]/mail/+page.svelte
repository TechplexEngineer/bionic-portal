<script lang="ts">
	import type { PageData, ActionData } from "./$types";
	import { enhance } from "$app/forms";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let subject = $state(`Update for ${data.event.name}`);
	let template = $state(
		`Hi {{first_name}},\n\nHere is an update for ${data.event.name}.\n\nCost: {{cost}}\nPayment Link: {{payment_link}}\n\nBest,\nBionic Portal`
	);
	let selectedRecipients = $state(data.registrations.map((r) => r.id));
	let sendToStudents = $state(true);
	let sendToParents = $state(true);

	let previewIndex = $state(0);
	let recipientSearch = $state("");
	let recipientFilter = $state("");
	let filteredRegistrations = $derived(
		data.registrations.filter((registration) => {
			const query = recipientSearch.trim().toLowerCase();
			const name = `${registration.student.firstName} ${registration.student.lastName}`;
			return (
				(!query || `${name} ${registration.student.userid}`.toLowerCase().includes(query)) &&
				(!recipientFilter ||
					(selectedRecipients.includes(registration.id) ? "selected" : "unselected") ===
						recipientFilter)
			);
		})
	);

	function insertVariable(variable: string) {
		const textarea = document.getElementById("template-editor") as HTMLTextAreaElement;
		if (!textarea) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		template = template.substring(0, start) + variable + template.substring(end);
		// Focus back and set cursor (optional, hard with Svelte $state)
	}

	let previewContent = $derived.by(() => {
		if (data.registrations.length === 0) return "No registrations to preview";
		const reg = data.registrations[previewIndex] || data.registrations[0];
		return template
			.replace(/{{first_name}}/g, reg.student.firstName)
			.replace(/{{last_name}}/g, reg.student.lastName)
			.replace(/{{event_name}}/g, data.event.name)
			.replace(/{{payment_link}}/g, reg.invoicePaymentLink || "<i>No payment link available</i>")
			.replace(/{{cost}}/g, data.event.cost.toString());
	});

	function toggleAll() {
		if (selectedRecipients.length === data.registrations.length) {
			selectedRecipients = [];
		} else {
			selectedRecipients = data.registrations.map((r) => r.id);
		}
	}
</script>

<div class="container py-4">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item"><a href="/admin/events">Events</a></li>
			<li class="breadcrumb-item"><a href="/admin/events/{data.event.id}">{data.event.name}</a></li>
			<li class="breadcrumb-item active">Mail Merge</li>
		</ol>
	</nav>

	<div class="d-flex justify-content-between align-items-center mb-4">
		<h1>Mail Merge: {data.event.name}</h1>
	</div>

	{#if form?.success}
		<div class="alert alert-success alert-dismissible fade show" role="alert">
			<strong>Success!</strong> Sent {form.sentCount} emails. {form.errorCount > 0
				? `${form.errorCount} failed.`
				: ""}
			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
		</div>
	{/if}

	<form method="POST" action="?/send" use:enhance>
		<div class="row">
			<div class="col-lg-7">
				<div class="card mb-4 shadow-sm">
					<div class="card-header bg-white">
						<h5 class="mb-0">Draft Message</h5>
					</div>
					<div class="card-body">
						<div class="mb-3">
							<label for="subject" class="form-label fw-bold">Subject</label>
							<input
								type="text"
								name="subject"
								id="subject"
								class="form-control"
								bind:value={subject}
								required
							/>
						</div>

						<div class="mb-2">
							<div class="form-label fw-bold">Variables</div>
							<div class="d-flex flex-wrap gap-2 mb-2">
								<button
									type="button"
									class="btn btn-outline-secondary btn-sm"
									onclick={() => insertVariable("{{first_name}}")}>First Name</button
								>
								<button
									type="button"
									class="btn btn-outline-secondary btn-sm"
									onclick={() => insertVariable("{{last_name}}")}>Last Name</button
								>
								<button
									type="button"
									class="btn btn-outline-secondary btn-sm"
									onclick={() => insertVariable("{{event_name}}")}>Event Name</button
								>
								<button
									type="button"
									class="btn btn-outline-secondary btn-sm"
									onclick={() => insertVariable("{{payment_link}}")}>Payment Link</button
								>
								<button
									type="button"
									class="btn btn-outline-secondary btn-sm"
									onclick={() => insertVariable("{{cost}}")}>Cost</button
								>
							</div>
						</div>

						<div class="mb-3">
							<label for="template-editor" class="form-label fw-bold"
								>Message Template (HTML supported)</label
							>
							<textarea
								name="template"
								id="template-editor"
								class="form-control"
								rows="12"
								bind:value={template}
								required
							></textarea>
						</div>

						<div class="d-flex gap-4">
							<div class="form-check">
								<input
									class="form-check-input"
									type="checkbox"
									name="sendToStudents"
									id="sendToStudents"
									bind:checked={sendToStudents}
								/>
								<label class="form-check-label" for="sendToStudents">Send to Students</label>
							</div>
							<div class="form-check">
								<input
									class="form-check-input"
									type="checkbox"
									name="sendToParents"
									id="sendToParents"
									bind:checked={sendToParents}
								/>
								<label class="form-check-label" for="sendToParents">Send to Parents</label>
							</div>
						</div>
					</div>
				</div>

				<div class="card mb-4 shadow-sm">
					<div class="card-header bg-white">
						<h5 class="mb-0">Preview</h5>
					</div>
					<div class="card-body bg-light">
						<div class="d-flex justify-content-between align-items-center mb-3">
							<span class="text-muted small"
								>Previewing recipient {previewIndex + 1} of {data.registrations.length}</span
							>
							<div class="btn-group">
								<button
									type="button"
									class="btn btn-sm btn-outline-secondary"
									disabled={previewIndex === 0}
									onclick={() => previewIndex--}>&laquo;</button
								>
								<button
									type="button"
									class="btn btn-sm btn-outline-secondary"
									disabled={previewIndex >= data.registrations.length - 1}
									onclick={() => previewIndex++}>&raquo;</button
								>
							</div>
						</div>
						<div
							class="border p-3 bg-white rounded shadow-sm"
							style="min-height: 200px; white-space: pre-wrap;"
						>
							{@html previewContent}
						</div>
					</div>
				</div>
			</div>

			<div class="col-lg-5">
				<div class="card shadow-sm sticky-top" style="top: 20px;">
					<div class="card-header bg-white d-flex justify-content-between align-items-center">
						<h5 class="mb-0">Recipients ({selectedRecipients.length})</h5>
						<button type="button" class="btn btn-link btn-sm p-0" onclick={toggleAll}>
							{selectedRecipients.length === data.registrations.length
								? "Deselect All"
								: "Select All"}
						</button>
					</div>
					<div class="card-body p-0" style="max-height: 60vh; overflow-y: auto;">
						<div class="d-flex flex-wrap gap-2 align-items-end p-3 border-bottom">
							<div class="flex-grow-1">
								<label class="form-label mb-1" for="recipient-search">Search recipients</label>
								<input
									id="recipient-search"
									class="form-control"
									type="search"
									placeholder="Search students or email..."
									bind:value={recipientSearch}
								/>
							</div>
							<div>
								<label class="form-label mb-1" for="recipient-filter">Filter</label>
								<select id="recipient-filter" class="form-select" bind:value={recipientFilter}>
									<option value="">All recipients</option>
									<option value="selected">Selected</option>
									<option value="unselected">Unselected</option>
								</select>
							</div>
						</div>
						<table class="table table-hover mb-0">
							<thead class="table-light sticky-top" style="top: 0;">
								<tr>
									<th style="width: 40px;"></th>
									<th>Name</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredRegistrations as reg (reg.id)}
									<tr>
										<td>
											<input
												type="checkbox"
												name="recipients"
												value={reg.id}
												bind:group={selectedRecipients}
											/>
										</td>
										<td>
											<div class="fw-bold">{reg.student.firstName} {reg.student.lastName}</div>
											<div class="small text-muted">{reg.student.userid}</div>
										</td>
										<td>
											{#if reg.paid}
												<span class="badge bg-success">Paid</span>
											{:else if reg.invoicePaymentLink}
												<span class="badge bg-primary">Invoiced</span>
											{:else}
												<span class="badge bg-warning text-dark">Uninvoiced</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="card-footer bg-white border-top-0 pt-3">
						<button
							type="submit"
							class="btn btn-primary w-100 py-2 fw-bold"
							disabled={selectedRecipients.length === 0}
						>
							Send to {selectedRecipients.length} Recipient{selectedRecipients.length === 1
								? ""
								: "s"}
						</button>
						<p class="text-center text-muted small mt-2 mb-0">
							Emails will be sent individually to each selected recipient.
						</p>
					</div>
				</div>
			</div>
		</div>
	</form>
</div>

<style>
	.sticky-top {
		z-index: 1020;
	}
</style>
