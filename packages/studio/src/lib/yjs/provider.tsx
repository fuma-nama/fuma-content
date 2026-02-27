import {
  HocuspocusProvider as HocuspocusProviderBase,
  HocuspocusProviderWebsocket,
  WebSocketStatus,
} from "@hocuspocus/provider";
import { getHocuspocusUrl } from ".";
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

export const RootContext = createContext<{
  wait: (provider: HocuspocusProvider) => boolean;
  ready: (provider: HocuspocusProvider) => void;
} | null>(null);

const ProviderContext = createContext<{ provider: HocuspocusProvider; synced: boolean } | null>(
  null,
);
const WebsocketContext = createContext<HocuspocusProviderWebsocket | null>(null);

class HocuspocusProvider extends HocuspocusProviderBase {
  type = "custom";
  get awareness(): Awareness {
    return super.awareness!;
  }

  get isConnected() {
    return this.configuration.websocketProvider.status === WebSocketStatus.Connected;
  }
}

export function useHocuspocusProvider() {
  const ctx = use(ProviderContext);
  if (!ctx) throw new Error("must be used under <HocuspocusContextProvider />");
  return ctx.provider;
}

export function WebsocketProvider({ children }: { children: ReactNode }) {
  const ws = useMemo(
    () =>
      new HocuspocusProviderWebsocket({
        autoConnect: false,
        url: getHocuspocusUrl(),
      }),
    [],
  );

  useEffect(() => {
    return () => {
      if (ws.status === WebSocketStatus.Connected) ws.disconnect();
    };
  }, []);

  if (typeof window !== "undefined" && ws.status === WebSocketStatus.Disconnected) {
    ws.connect();
  }

  return <WebsocketContext value={ws}>{children}</WebsocketContext>;
}

export function HocuspocusContextProvider({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const ws = use(WebsocketContext)!;
  const provider = useMemo(() => {
    const document = new Y.Doc({ guid: name });
    return new HocuspocusProvider({
      name,
      url: getHocuspocusUrl(),
      document,
      awareness: new Awareness(document),
      websocketProvider: ws,
      onSynced(data) {
        setSynced(data.state);
      },
    });
  }, [name, ws]);
  const [synced, setSynced] = useState(() => provider.synced);

  useEffect(() => {
    return () => {
      if (provider.isAttached) provider.detach();
    };
  }, []);

  if (typeof window !== "undefined" && !provider.isAttached) {
    provider.attach();
  }

  return (
    <ProviderContext value={useMemo(() => ({ provider, synced }), [provider, synced])}>
      {children}
    </ProviderContext>
  );
}

export function useIsSync() {
  return use(ProviderContext)?.synced ?? false;
}

export function useStatus(): WebSocketStatus {
  const ws = use(WebsocketContext)!;
  const [status, setStatus] = useState<WebSocketStatus>(() => ws.status);

  const onChangeStatus = useEffectEvent(() => {
    setStatus(ws.status);
  });

  useEffect(() => {
    ws.on("status", onChangeStatus);
    return () => {
      ws.off("status", onChangeStatus);
    };
  }, [ws]);

  return status;
}
