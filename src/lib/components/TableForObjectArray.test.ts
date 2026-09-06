import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { within } from "@testing-library/dom";
import TableForObjectArray, { type TableColumns } from "./TableForObjectArray.svelte";

const sampleData = [{ name: "Alice", age: "25" }];

describe("TableForObjectArray", () => {
	it("renders columns without explicit list", () => {
		render(TableForObjectArray, { data: sampleData });
		// screen.debug();
		expect(screen.queryByText("Name")).toBeVisible();
		expect(screen.queryByText("Age")).toBeVisible();
	});

	it("renders columns with custom title", () => {
		const columns = [
			{ data: "name", title: "Name" },
			{ data: "age", title: "Age" }
		];
		render(TableForObjectArray, { data: sampleData, columns: columns });
		expect(screen.queryByText("Name")).toBeVisible();
		expect(screen.queryByText("Age")).toBeVisible();
	});

	it("renders columns with custom title and without custom title", () => {
		const columns = ["name", { data: "age", title: "User Age" }];
		render(TableForObjectArray, { data: sampleData, columns: columns });
		expect(screen.queryByText("Name")).toBeVisible();
		expect(screen.queryByText("User Age")).toBeVisible();
	});

	it("uses the data property to determine what to render", () => {
		const columns = [{ data: "name", title: "Age" }];
		render(TableForObjectArray, { data: sampleData, columns: columns });
		expect(screen.queryByText("Age")).toBeVisible();
		expect(within(screen.getByRole("table")).getByText("Alice")).toBeVisible();
		expect(screen.queryByText("25")).toBeNull();
	});

	it("supports custom render function, three args, val, type and row ", () => {
		const renderFn = vi.fn(() => "");

		const columns = [{ data: "name", title: "Age", render: renderFn }];
		render(TableForObjectArray, { data: sampleData, columns: columns });
		expect(renderFn).toBeCalledTimes(1);
		expect(renderFn).toBeCalledWith("Alice", null, sampleData[0]);
	});

	it("Renders message about having no data if none is supplied", () => {
		render(TableForObjectArray, { data: [] });
		expect(screen.getByText("No data to display")).toBeVisible();
	});

	it("capitalizes column headings when columns are not passed in", () => {
		render(TableForObjectArray, { data: sampleData });
		// screen.debug();
		expect(screen.queryByText("Name")).toBeVisible();
		expect(screen.queryByText("Age")).toBeVisible();
	});

	it("renders data", () => {
		render(TableForObjectArray, { data: sampleData });
		// screen.debug();
		expect(document.querySelector("tbody tr td")?.textContent).toBe(sampleData[0].name);
	});

	it("supports alternate render funcion renderHTML which renders the passed string as html", () => {
		const columns: TableColumns = [
			{ data: "name", title: "Age", renderHTML: (val) => `<strong>${val}</strong>` }
		];
		render(TableForObjectArray, { data: sampleData, columns: columns });
		screen.debug();
		expect(document.querySelector("tbody tr td strong")?.textContent).toBe(sampleData[0].name);
	});

	it("searches across visible columns", async () => {
		render(TableForObjectArray, {
			data: [
				{ name: "Alice", age: "25" },
				{ name: "Bob", age: "30" }
			]
		});
		await fireEvent.input(screen.getByRole("searchbox"), { target: { value: "bob" } });

		expect(within(screen.getByRole("table")).getByText("Bob")).toBeVisible();
		expect(within(screen.getByRole("table")).queryByText("Alice")).toBeNull();
	});

	it("renders only the search control", () => {
		render(TableForObjectArray, {
			data: [
				{ name: "Alice", age: "25" },
				{ name: "Bob", age: "30" }
			]
		});

		expect(screen.getByRole("searchbox")).toBeVisible();
		expect(screen.queryByRole("combobox")).toBeNull();
	});

	it("supports repeated data fields in separate columns", () => {
		render(TableForObjectArray, {
			data: [{ userid: "alice@example.com" }],
			columns: [
				{ data: "userid", title: "User ID" },
				{ data: "userid", title: "Actions" }
			]
		});

		expect(screen.queryAllByRole("combobox")).toHaveLength(0);
	});
});
