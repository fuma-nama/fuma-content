import { RootView } from "@/components/view";

export default function Page() {
  return <RootView />;
}

export function getConfig() {
  return {
    render: "dynamic",
  };
}
