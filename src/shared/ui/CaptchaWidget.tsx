import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: string | HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaScriptLoad?: () => void;
  }
}

const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaScriptLoad&render=explicit";
let scriptLoadPromise: Promise<void> | undefined;

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    window.onRecaptchaScriptLoad = () => resolve();
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

// Google reCAPTCHA v2 ("I'm not a robot" checkbox) only -- the platform also
// supports hCaptcha/bcaptcha (see blocks-captcha skill), but this app wires
// up the one the hackathon actually configures.
export function CaptchaWidget({ onChange, siteKey }: { onChange: (token: string | null) => void; siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const domId = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;
    loadRecaptchaScript().then(() => {
      if (cancelled) return;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || widgetIdRef.current !== undefined) return;
    widgetIdRef.current = window.grecaptcha?.render(containerRef.current, {
      callback: (token: string) => onChange(token),
      "expired-callback": () => onChange(null),
      "error-callback": () => onChange(null),
      sitekey: siteKey
    });
    // onChange is stable across the widget's lifetime in this app (see
    // RegisterPage) -- re-rendering the widget on every onChange identity
    // change would fight grecaptcha's own DOM ownership of the container.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, siteKey]);

  return <div id={domId} ref={containerRef} className="captcha-widget" />;
}
