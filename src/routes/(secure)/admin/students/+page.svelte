<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const columns: TableColumns = [
		// Userid	FirstName	LastName	Data	Hidden
		{ data: "userid", title: "User ID" },
		{ data: "firstName", title: "First Name" },
		{ data: "lastName", title: "Last Name" },
		{ data: "graduationYear", title: "YOG" },
		{ data: "parentCount", title: "Parents", renderSnippet: parentStatus },
		{ data: "hidden", title: "Hidden" },
		{ data: "userid", title: "Actions", renderSnippet: action }
	];

	layoutState.pageTitle = "Student Overview";
</script>

{#snippet parentStatus(count: number)}
	{#if count > 0}
		<span class="badge bg-success">{count} Registered</span>
	{:else}
		<span class="badge bg-secondary">None</span>
	{/if}
{/snippet}

{#snippet action(id: string)}
	<a href={`/admin/students/${id}`} class="btn btn-primary btn-small">Edit</a>
{/snippet}

<div class="container">
	<h1>Student Overview</h1>

	<TableForObjectArray data={data.students} {columns} />
</div>
