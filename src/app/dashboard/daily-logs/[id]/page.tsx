import { Suspense } from "react";
import DailyLogComponent from "../components/detail";
import { getDailyLogWithDetailsById } from "@/app/actions/daily-logs";

export default async function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const log = await getDailyLogWithDetailsById(id);

    return (
        <Suspense>
            <DailyLogComponent log={log} />
        </Suspense>
    );
}