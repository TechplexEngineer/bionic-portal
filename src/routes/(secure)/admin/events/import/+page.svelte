<script lang="ts">
	import { enhance } from "$app/forms";
	import { layoutState } from "../../+layout.svelte";
	import type { PageProps } from "./$types";
	import * as XLSX from "xlsx";
	import ImportMapping from "$lib/components/ImportMapping.svelte";
	import type { ImportField } from "$lib/utils/import";

	let { form }: PageProps = $props();

	layoutState.pageTitle = "Import Events";

	let headers: string[] = $state([]);
	let mapping: Record<string, string> = $state({});
	let showMapping = $state(false);

	const eventFields: ImportField[] = [
		{ name: "name", label: "Event Name", searchTerms: ["name", "title", "event"], required: true },
		{ name: "startDate", label: "Start Date", searchTerms: ["start", "begin"], required: true },
		{ name: "endDate", label: "End Date", searchTerms: ["end", "stop"], required: true },
		{
			name: "location",
			label: "Location",
			searchTerms: ["location", "venue", "place"],
			required: true
		},
		{
			name: "registrationDueDate",
			label: "Registration Due Date",
			searchTerms: ["due", "deadline", "registration"],
			required: true
		},
		{ name: "cost", label: "Cost", searchTerms: ["cost", "price", "amount"], required: true },
		{ name: "isOvernight", label: "Is Overnight", searchTerms: ["overnight", "multi-day"] },
		{ name: "departureTime", label: "Departure Time", searchTerms: ["departure", "leave"] },
		{ name: "returnTime", label: "Return Time", searchTerms: ["return", "arrive"] },
		{ name: "description", label: "Description", searchTerms: ["description", "details", "info"] },
		{ name: "hotelAddress", label: "Hotel Address", searchTerms: ["hotel", "address"] }
	];

	async function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		if (json.length > 0) {
			headers = json[0] as string[];
			showMapping = true;
		}
	}
</script>

<div class="container mt-4">
	<h1>{layoutState.pageTitle}</h1>

	<div class="card mt-4">
		<div class="card-header">Upload Events File</div>
		<div class="card-body">
			{#if form?.error}
				<div class="alert alert-danger" role="alert">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">
					Successfully imported {form.imported} events!
					<a href="/admin/events" class="alert-link">Back to events</a>
				</div>
			{/if}

			{#if !form?.success}
				<form method="post" action="?/import" enctype="multipart/form-data" use:enhance>
					<div class="mb-4">
						<label for="file" class="form-label">Select CSV or Excel file</label>
						<input
							type="file"
							class="form-control"
							id="file"
							name="file"
							accept=".csv,.xlsx,.xls"
							onchange={handleFileChange}
							required
						/>
					</div>

					{#if showMapping}
						<ImportMapping {headers} fields={eventFields} bind:mapping />

						<button type="submit" class="btn btn-primary">
							<i class="fa fa-save me-1"></i> Start Import
						</button>
					{/if}
				</form>
			{/if}
		</div>
	</div>
</div>
