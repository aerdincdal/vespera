import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MODULE_SLUGS } from "@/lib/nav";
import { modulesMock } from "@/lib/mock/modules";
import { ModulePage } from "@/components/modules/module-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return MODULE_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: modulesMock[slug]?.title ?? "Modül" };
}

export default async function ModuleRoute({ params }: Props) {
  const { slug } = await params;
  if (!MODULE_SLUGS.includes(slug)) notFound();
  return <ModulePage slug={slug} />;
}
