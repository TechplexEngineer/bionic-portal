export async function sendMagicLink(email: string, url: string, apiKey: string) {
	const escapedUrl = url
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	return sendEmail(
		[{ email }],
		"Sign in to Bionic Portal",
		`<p>Use the link below to sign in to Bionic Portal.</p><p><a href="${escapedUrl}">Sign in to Bionic Portal</a></p><p>This link expires in 15 minutes and can only be used once.</p><p>If you did not request this email, you can ignore it.</p>`,
		apiKey,
		{ name: "Team 4909 No Reply", email: "no-reply@team4909.org" }
	);
}

export async function sendParentFormInvite(
	email: string,
	studentName: string,
	eventName: string,
	url: string,
	apiKey: string
) {
	const escapeHtml = (value: string) =>
		value
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	return sendEmail(
		[{ email }],
		`Parent signature needed for ${studentName}`,
		`<p>${escapeHtml(studentName)} has completed their part of a form for ${escapeHtml(eventName)}.</p><p>Please sign in to Bionic Portal to complete the parent signature.</p><p><a href="${escapeHtml(url)}">Review and sign the form</a></p><p>This invitation expires in 7 days.</p>`,
		apiKey,
		{ name: "Team 4909 No Reply", email: "no-reply@team4909.org" }
	);
}

export async function sendEmail(
	to: { email: string; name?: string }[],
	subject: string,
	htmlContent: string,
	apiKey: string,
	sender = { name: "Bionic Portal", email: "no-reply@team4909.org" }
) {
	if (!apiKey.trim()) throw new Error("BREVO_API_KEY is required");
	const response = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			accept: "application/json",
			"api-key": apiKey,
			"content-type": "application/json"
		},
		body: JSON.stringify({ sender, to, subject, htmlContent }),
		signal: AbortSignal.timeout(10000)
	});
	// Provider responses may contain recipient details; do not include them in errors.
	if (!response.ok) throw new Error(`Email delivery failed (${response.status})`);
	return response.json();
}
