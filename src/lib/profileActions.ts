export function hasPendingActionItems(profileIncomplete: boolean, eventActionItemCount: number) {
	return profileIncomplete || eventActionItemCount > 0;
}
