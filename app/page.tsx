import { AppProvider } from "@/lib/WizardContext";
import { WizardContainer } from "@/components/WizardContainer";

export const metadata = {
  title: "見積作成システム | リフォーム見積",
  description: "リフォームの見積を簡単に作成できるシステムです。部屋ごとの工事項目を選択し、数量・単価を入力するだけで見積が完成します。",
};

export default function Home() {
  return (
    <AppProvider>
      <WizardContainer />
    </AppProvider>
  );
}
