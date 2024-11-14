import type { OutageStatus } from "$lib/outage/outage-status";

export class CommentDD {
    public status: OutageStatus | undefined;
    public allStatuses: boolean | undefined;
    public comment: string | undefined;
}