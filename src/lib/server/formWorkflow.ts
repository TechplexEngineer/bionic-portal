import type { FormDefinition, FormField, FormValues } from "@team4909/bionic-sign";

export type FormOwner = "student" | "parent";
export type FormStatus = "student-incomplete" | "parent-pending" | "complete";

export function getAgeOnDate(dateOfBirth: string, date: Date) {
	const birth = new Date(`${dateOfBirth}T00:00:00Z`);
	let age = date.getUTCFullYear() - birth.getUTCFullYear();
	const birthdayNotReached =
		date.getUTCMonth() < birth.getUTCMonth() ||
		(date.getUTCMonth() === birth.getUTCMonth() && date.getUTCDate() < birth.getUTCDate());
	if (birthdayNotReached) age -= 1;
	return age;
}

export function getOwnedFields(definition: FormDefinition, owner: FormOwner): FormField[] {
	return definition.fields.filter((field) =>
		owner === "parent" ? field.name.startsWith("parent_") : !field.name.startsWith("parent_")
	);
}

function hasValue(value: FormValues[string] | undefined) {
	if (!value) return false;
	return value.type === "text" ? value.value.trim().length > 0 : value.image.length > 0;
}

export function hasRequiredValues(
	definition: FormDefinition,
	values: FormValues,
	owner: FormOwner
) {
	return getOwnedFields(definition, owner)
		.filter((field) => field.required)
		.every((field) => hasValue(values[field.name]));
}

export function validateOwnedValues(
	definition: FormDefinition,
	values: FormValues,
	owner: FormOwner
): FormValues {
	const fields = new Map(definition.fields.map((field) => [field.name, field]));
	const owned = new Set(getOwnedFields(definition, owner).map((field) => field.name));
	const result: FormValues = {};
	for (const [name, value] of Object.entries(values)) {
		if (!owned.has(name)) throw new Error(`Only ${owner}-owned fields may be submitted.`);
		const field = fields.get(name)!;
		const expectedType = field.type === "signature" ? "signature" : "text";
		if (value.type !== expectedType) throw new Error(`Field "${name}" has an invalid value type.`);
		result[name] = value;
	}
	return result;
}

export function getFormStatus({
	definition,
	studentValues,
	parentValues,
	under18
}: {
	definition: FormDefinition;
	studentValues: FormValues;
	parentValues: FormValues;
	under18: boolean;
}): FormStatus {
	if (!hasRequiredValues(definition, studentValues, "student")) return "student-incomplete";
	const hasParentFields = getOwnedFields(definition, "parent").some((field) => field.required);
	if (under18 && hasParentFields && !hasRequiredValues(definition, parentValues, "parent")) {
		return "parent-pending";
	}
	return "complete";
}
