import { type RequestHandler, json } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import { ATTENDANCE_SEASON_START } from "$lib/server/attendance";

// Simple GET API that returns attendance JSON.
// Replace attendanceData with a DB call (D1/Drizzle) when integrating.
export const GET: RequestHandler = async ({ locals, request }) => {
	const providedKey = request.headers.get("x-api-key");
	const { env } = await import("$env/dynamic/private");
	const expectedKey = env.INTERNAL_API_KEY;
	if (typeof expectedKey !== "string") {
		console.log(`Missing expected API key (INTERNAL_API_KEY) in environment.`);
	}

	if (!providedKey || !expectedKey || providedKey !== expectedKey) {
		console.log(
			`Unauthorized access attempt with key: ${providedKey} expected key: ${expectedKey}`
		);

		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const meetingsResult = await locals.db.run(sql`
            WITH total_meetings AS (
                SELECT COUNT(*) AS totalMeetings
                FROM (
                    SELECT DATE(timestamp, 'unixepoch') AS date
                    FROM attendance
                    WHERE DATE(timestamp, 'unixepoch') >= ${ATTENDANCE_SEASON_START}
                    GROUP BY DATE(timestamp, 'unixepoch')
                )
            )
            SELECT
                a.userid,
                COUNT(*) AS numAttended,
                tm.totalMeetings,
                CAST(COUNT(*) AS FLOAT) / tm.totalMeetings AS percentAttended
            FROM attendance a
            CROSS JOIN total_meetings tm
            WHERE DATE(a.timestamp, 'unixepoch') >= ${ATTENDANCE_SEASON_START}
            GROUP BY a.userid;
        `);

	return json(meetingsResult.results);
};
