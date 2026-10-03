import { CategoryDetailView } from "@/components/admin/duas/CategoryDetailView";

export default async function DuaCategoryPage(props: PageProps<"/admin/duas/categories/[slug]">) {
  const { slug } = await props.params;
  return <CategoryDetailView slug={decodeURIComponent(slug)} />;
}
