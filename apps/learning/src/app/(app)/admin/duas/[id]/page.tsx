import { EditDuaView } from "@/components/admin/duas/DuaEditor";

export default async function EditDuaPage(props: PageProps<"/admin/duas/[id]">) {
  const { id } = await props.params;
  return <EditDuaView id={id} />;
}
