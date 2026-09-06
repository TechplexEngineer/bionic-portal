<script lang="ts">
	import { resolve } from "$app/paths";
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
	const showArchivedUrl = "/admin/students?showArchived=true";

	const columns: TableColumns = [
		// Userid	FirstName	LastName	Data	Hidden
		{ data: "userid", title: "User ID" },
		{ data: "firstName", title: "First Name" },
		{ data: "lastName", title: "Last Name" },
		{ data: "graduationYear", title: "YOG" },
		{ data: "parentCount", title: "Parents", renderSnippet: parentStatus },
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

{#snippet action(id: string, student: Record<string, number | string | boolean | null>)}
	<a href={resolve(`/admin/students/${id}`)} class="btn btn-primary btn-sm me-1">Edit</a>
	<form method="POST" action="?/toggleHidden" style="display:inline;">
		<input type="hidden" name="id" value={id} />
		<button type="submit" class="btn btn-outline-secondary btn-sm me-1">
			{student.hidden ? "Unhide" : "Hide"}
		</button>
	</form>
	<form method="POST" action="?/delete" style="display:inline;">
		<input type="hidden" name="id" value={id} />
		<button
			type="submit"
			class="btn btn-danger btn-sm"
			onclick={(event) => {
				const relatedRecords = [
					["parent links", student.parentCount],
					["attendance records", student.attendanceCount],
					["event registrations", student.registrationCount],
					["room assignments", student.roomAssignmentCount],
					["carpool assignments", student.carpoolAssignmentCount]
				]
					.filter(([, count]) => Number(count) > 0)
					.map(([label, count]) => `${count} ${label}`);
				const summary =
					relatedRecords.length > 0
						? `\n\nThis will also delete: ${relatedRecords.join(", ")}.`
						: "";

				if (
					!confirm(
						`Permanently delete ${student.firstName} ${student.lastName} (${id})?${summary}\n\nThis cannot be undone.`
					)
				) {
					event.preventDefault();
				}
			}}>Delete</button
		>
	</form>
{/snippet}

{#snippet studentToolbar()}
	{#if data.showArchived}
		<a href={resolve("/admin/students")} class="btn btn-outline-secondary btn-sm"
			>Show current students only</a
		>
	{:else}
		<a href={resolve(showArchivedUrl)} class="btn btn-outline-secondary btn-sm"
			>Show hidden and last year's students</a
		>
	{/if}
{/snippet}

<div class="container">
	<h1>Student Overview</h1>
	<TableForObjectArray data={data.students} {columns} toolbar={studentToolbar} />
</div>
