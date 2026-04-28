import { getTemplates } from "./actions";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const result = await getTemplates();
  const templates = result.templates ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Email Templates</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Templates are available on every business card. Variables like{" "}
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
              {"{{business_name}}"}
            </code>{" "}
            are filled in automatically.
          </p>
        </div>
      </div>
      <TemplatesClient initialTemplates={templates} />
    </div>
  );
}
