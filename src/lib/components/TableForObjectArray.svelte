<script module lang="ts">
	import type { Snippet } from "svelte";

	type value = any;

	export type TableColumns = (
		| string
		| {
				data: string;
				title: string;
				render?: renderFn;
				renderHTML?: renderFn;
				renderSnippet?: Snippet<[value, Record<string, any>]>;
		  }
	)[];
	export type renderFn = (val: any, type: any, row: any) => string;
</script>

<script lang="ts">
	// import * as XLSX from 'xlsx';

	interface Props {
		data: Record<string, any>[];
		id?: string;
		tableName?: string;
		columns?: TableColumns;
		toolbar?: Snippet;
		searchable?: boolean;
	}
	const {
		data,
		id,
		tableName,
		columns = Object.keys(data[0] || { "No Data": "" }),
		toolbar,
		searchable = true
	}: Props = $props();

	let searchTerm = $state("");

	// export let data: Record<string, string | number>[];
	// export let id: string = '';
	// export let tableName: string = '';

	// export let columns: TableColumns = Object.keys(data[0] || { 'No Data': '' });
	const cols2Render = $derived(
		columns.map((k) => {
			if (typeof k === "string") {
				return {
					data: k,
					title: k.charAt(0).toUpperCase() + k.slice(1)
				};
			}
			return k;
		})
	);

	const filteredData = $derived(
		data.filter((row) => {
			if (!searchable) return true;

			const normalizedSearch = searchTerm.trim().toLowerCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				cols2Render.some((column) =>
					String(row[column.data] ?? "")
						.toLowerCase()
						.includes(normalizedSearch)
				);
			return matchesSearch;
		})
	);

	// const exportExcel = () => {
	// 	const worksheet = XLSX.utils.json_to_sheet(data);
	// 	const workbook = XLSX.utils.book_new();
	// 	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
	// 	XLSX.writeFile(workbook, `${tableName ? tableName : 'data'}.xlsx`, { compression: true });
	// };
</script>

<!-- <div class="d-flex justify-content-end d-print-none">
	<button class="btn btn-info" onclick={exportExcel}>Export Table Excel</button>
</div> -->
{#if searchable || toolbar}
	<div class="d-flex flex-wrap gap-2 align-items-end mb-3 d-print-none">
		{#if searchable}
			<div class="flex-grow-1">
				<label class="form-label mb-1" for={`${id ?? "table"}-search`}>Search</label>
				<input
					id={`${id ?? "table"}-search`}
					type="search"
					class="form-control"
					placeholder="Search this table..."
					aria-label="Search this table"
					bind:value={searchTerm}
				/>
			</div>
		{/if}
		{#if toolbar}
			<div class="ms-auto">
				{@render toolbar()}
			</div>
		{/if}
	</div>
{/if}
{#if searchable}
	<p class="text-muted small mb-2 d-print-none">
		Showing {filteredData.length} of {data.length} rows
	</p>
{/if}

<table class="table table-striped table-bordered-vertical" {id}>
	<thead>
		<tr>
			{#each cols2Render as obj}
				<th style="font-weight: bold;">{obj.title}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each filteredData as row}
			<tr>
				{#each cols2Render as colCfg}
					<td style="border-right: 1px solid #dee2e6; border-left: 1px solid #dee2e6;">
						{#if colCfg.render}
							{colCfg.render(row[colCfg.data], null, row)}
						{:else if colCfg.renderHTML}
							{@html colCfg.renderHTML(row[colCfg.data], null, row)}
						{:else if colCfg.renderSnippet}
							{@render colCfg.renderSnippet(row[colCfg.data], row)}
						{:else}
							{row[colCfg.data]}
						{/if}
					</td>
				{/each}
			</tr>
		{:else}
			<tr>
				<td colspan={columns.length}>No data to display</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	/* these styles do not work when we inject into iframe*/
	th {
		font-weight: bold;
	}
	.table-bordered-vertical {
		border: none;
	}

	.table-bordered-vertical th,
	.table-bordered-vertical td {
		border-left: 1px solid #dee2e6;
		border-right: 1px solid #dee2e6;
	}

	.table-bordered-vertical th:first-child,
	.table-bordered-vertical td:first-child {
		border-left: none;
	}

	.table-bordered-vertical th:last-child,
	.table-bordered-vertical td:last-child {
		border-right: none;
	}
	@media print {
		tr {
			break-inside: avoid;
		}
	}
</style>
