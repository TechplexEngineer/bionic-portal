<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import { layoutState } from "../../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const columns: TableColumns = [
		{ data: "first", title: "First" },
		{ data: "last", title: "Last" },
		{ data: "email", title: "Email" },
		{ data: "total", title: "Total" },
		{ data: "percent", title: "Percentage", render: (value: number) => `${value.toFixed(2)}%` }
	];

	for (const meeting of data.meetings) {
		columns.push({
			data: meeting.date,
			title: meeting.date
		});
	}
	// columns.push({
	// 	data: "email",
	// 	title: "Actions"
	// });

	layoutState.pageTitle = "Student Attendance";
</script>

<div class="container">
	<h1>{layoutState.pageTitle}</h1>

	<TableForObjectArray data={data.attend} {columns} />
</div>
