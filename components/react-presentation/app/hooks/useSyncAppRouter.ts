import { useEffect } from 'react';
import { useRouter } from 'next/router';

type RouteEvent = CustomEvent<string>;

const useSyncAppRouter = ({ basepath }: { basepath: string }) => {
  const router = useRouter();

  useEffect(() => {
    const appNavigated = ({ detail }: RouteEvent) => {
      if (detail === router.asPath) {
        return;
      }
      router.push(detail);
    };

    globalThis.addEventListener('app', appNavigated as EventListener);

    return () => {
      globalThis.removeEventListener('app', appNavigated as EventListener);
    };
  }, [router, basepath]);

  useEffect(() => {
    if (router.asPath.startsWith(basepath)) {
      globalThis.dispatchEvent(
        new CustomEvent('shell', {
          detail: router.asPath.replace(basepath, ''),
        })
      );
    }
  }, [router.asPath, basepath]);
};

export default useSyncAppRouter;
