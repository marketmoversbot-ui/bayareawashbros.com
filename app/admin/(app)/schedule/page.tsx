import AdminTopBar from "../../../../components/AdminTopBar";
import ScheduleEditor from "../../../../components/ScheduleEditor";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  return (
    <>
      <AdminTopBar title="Schedule" />
      <main style={{ padding: 16 }}>
        <ScheduleEditor />
      </main>
    </>
  );
}
