import { describe, expect, it } from "vitest";
import { getProfileCompleteness } from "./profileCompleteness";

describe("getProfileCompleteness", () => {
	it("requires the requested parent profile fields", () => {
		const result = getProfileCompleteness("parent", {
			userId: "parent-1",
			phone: "555-0100",
			educationLevel: "College",
			degree: null,
			jobTitle: ""
		});

		expect(result).toMatchObject({ incomplete: true, href: "/register/parent" });
		expect(result.missingFields).toEqual(["degree", "job title"]);
	});

	it("recognizes a complete mentor profile for admins", () => {
		const result = getProfileCompleteness("admin", {
			userId: "admin-1",
			firstName: "Alex",
			lastName: "Mentor",
			phone: "555-0100",
			company: "Team 4909",
			tshirtSize: "L",
			firstAlumni: "no"
		});

		expect(result).toEqual({ incomplete: false, missingFields: [], href: "/register/mentor" });
	});

	it("requires student registration questions", () => {
		const result = getProfileCompleteness("user", {
			userid: "student@example.com",
			firstName: "Sam",
			lastName: "Student",
			dateOfBirth: "2010-01-01",
			graduationYear: "2028",
			tshirtSize: "M",
			currentGrade: "10",
			gender: "X",
			parentEmails: "parent@example.com",
			parentPhone: "555-0100",
			intoleranceLevel: "prefer_not",
			customFields: JSON.stringify({
				aspirationsAfterHighSchool: "College",
				winterSpringSports: "Track",
				teamGoals: "Learn"
			}),
			parentNames: null,
			phone: null,
			dietaryRestrictions: null,
			hidden: false
		} as never);

		expect(result).toEqual({ incomplete: false, missingFields: [], href: "/register" });
	});
});
