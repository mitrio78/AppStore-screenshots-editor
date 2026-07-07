import { ScreenshotEditor } from "@/components/editor/screenshot-editor";
import { I18nProvider } from "@/lib/i18n";

export default function Page() {
  return (
    <I18nProvider>
      <ScreenshotEditor />
    </I18nProvider>
  );
}
