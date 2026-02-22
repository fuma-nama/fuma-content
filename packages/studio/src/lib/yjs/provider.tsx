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

const ProviderContext = createContext<HocuspocusProvider | null>(null);
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
  return ctx;
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
    if (ws.status === WebSocketStatus.Disconnected) ws.connect();

    return () => {
      if (ws.status === WebSocketStatus.Connected) ws.disconnect();
    };
  }, []);

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
    });
  }, [name, ws]);

  useEffect(() => {
    provider.attach();

    return () => {
      provider.detach();
    };
  }, []);

  return <ProviderContext value={provider}>{children}</ProviderContext>;
}

export function useIsSync() {
  const provider = useHocuspocusProvider();
  const [status, setStatus] = useState(() => provider.isSynced);

  const onChange = useEffectEvent(() => {
    setStatus(provider.isSynced);
  });

  useEffect(() => {
    provider.on("synced", onChange);

    return () => {
      provider.off("synced", onChange);
    };
  }, [provider]);

  return status;
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
