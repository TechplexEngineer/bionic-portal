import { getTableColumns } from "drizzle-orm";
import { students } from "$lib/server/db/schema";

export type StudentField = {
	key: string;
	label: string;
	inputType: "text" | "number" | "checkbox";
	required: boolean;
};

const labelFor = (key: string) =>
	key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());

export const getStudentFields = (): StudentField[] =>
	Object.entries(getTableColumns(students)).map(([key, column]) => {
		const dataType = column.dataType as string;
		return {
			key,
			label: labelFor(key),
			inputType: dataType === "boolean" ? "checkbox" : dataType === "number" ? "number" : "text",
			required: column.notNull && !column.hasDefault
		};
	});
