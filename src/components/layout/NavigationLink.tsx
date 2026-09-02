"use client";

import NextLink from "next/link";
import { forwardRef, useEffect, useRef, type ComponentProps } from "react";
import { getNavigationTarget, isPlainNavigationClick } from "@/lib/navigation";
import { useNavigation } from "./NavigationProvider";

/** Keeps native link semantics; only ordinary in-app navigation gets a transition. */
const NavigationLink = forwardRef<
  HTMLAnchorElement,
  ComponentProps<typeof NextLink>
>(function NavigationLink(
  {
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onTouchStart,
    prefetch,
    replace,
    scroll,
    legacyBehavior,
    ...props
  },
  ref,
) {
  const navigation = useNavigation();
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  const cancelPrefetch = () => clearTimeout(hoverTimer.current);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return (
    <NextLink
      {...props}
      ref={ref}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      legacyBehavior={legacyBehavior}
      onClick={(event) => {
        onClick?.(event);
        cancelPrefetch();
        if (
          !navigation ||
          legacyBehavior ||
          !isPlainNavigationClick(
            event,
            event.currentTarget.target,
            event.currentTarget.hasAttribute("download"),
          )
        )
          return;
        const target = getNavigationTarget(
          event.currentTarget.href,
          window.location.href,
        );
        if (!target) return;
        event.preventDefault();
        if (replace) navigation.replace(target, { scroll });
        else navigation.push(target, { scroll });
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (prefetch === false || legacyBehavior) return;
        const href = event.currentTarget.href;
        cancelPrefetch();
        hoverTimer.current = setTimeout(() => navigation?.prefetch(href), 90);
      }}
      onMouseLeave={(event) => {
        cancelPrefetch();
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (prefetch !== false && !legacyBehavior)
          navigation?.prefetch(event.currentTarget.href);
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (prefetch !== false && !legacyBehavior)
          navigation?.prefetch(event.currentTarget.href);
      }}
    />
  );
});

export default NavigationLink;
