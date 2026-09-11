import type { MentorProfile, ParentProfile, Student } from "$lib/server/db/schema";
import type { Role } from "$lib/roles";

export type ProfileCompleteness = {
	incomplete: boolean;
	missingFields: string[];
	href: string;
};

const hasValue = (value: unknown) => typeof value === "string" && value.trim().length > 0;

const missing = (fields: [string, unknown][]) =>
	fields.filter(([, value]) => !hasValue(value)).map(([label]) => label);

export function getProfileCompleteness(
	role: Role,
	profile: ParentProfile | MentorProfile | Student | null
): ProfileCompleteness {
	if (role === "parent") {
		const parent = profile as ParentProfile | null;
		const missingFields = missing([
			["phone number", parent?.phone],
			["level of education", parent?.educationLevel],
			["degree", parent?.degree],
			["job title", parent?.jobTitle]
		]);
		return { incomplete: missingFields.length > 0, missingFields, href: "/register/parent" };
	}

	if (role === "mentor" || role === "admin") {
		const mentor = profile as MentorProfile | null;
		const missingFields = missing([
			["first name", mentor?.firstName],
			["last name", mentor?.lastName],
			["phone number", mentor?.phone],
			["company or organization", mentor?.company],
			["shirt size", mentor?.tshirtSize],
			["FIRST alumni status", mentor?.firstAlumni]
		]);
		return { incomplete: missingFields.length > 0, missingFields, href: "/register/mentor" };
	}

	const student = profile as Student | null;
	let customFields: Record<string, unknown> = {};
	if (student?.customFields) {
		try {
			customFields = JSON.parse(student.customFields) as Record<string, unknown>;
		} catch {
			customFields = {};
		}
	}
	const missingFields = missing([
		["first name", student?.firstName],
		["last name", student?.lastName],
		["date of birth", student?.dateOfBirth],
		["graduation year", student?.graduationYear],
		["shirt size", student?.tshirtSize],
		["current grade", student?.currentGrade],
		["gender", student?.gender],
		["parent email", student?.parentEmails],
		["parent phone number", student?.parentPhone],
		["dietary intolerance level", student?.intoleranceLevel],
		["aspirations after high school", customFields.aspirationsAfterHighSchool],
		["winter/spring sports", customFields.winterSpringSports],
		["team goals", customFields.teamGoals]
	]);
	return { incomplete: missingFields.length > 0, missingFields, href: "/register" };
}
