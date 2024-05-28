import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/router";

import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import { debounce } from "lodash-es";

import { Input } from "@/components/form/Input";
import { Switcher, SwitcherOption, SwitcherReset } from "@/components/switcher/Switcher";
import { Text } from "@/components/text/Text";
import { HorizontalScroll } from "@/components/utils/HorizontalScroll";
import theme from "@/theme";

const StyledSearchOptions = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    grid-gap: 1rem;
    
    @media (max-width: ${theme.breakpoints.mobileMax}) {
        grid-template-columns: 1fr;
        align-items: stretch;
    }
`;

const updateSearchQuery = debounce((router, newSearchQuery) => {
    // Update URL to maintain the searchQuery on page navigation.
    const newUrlParams = {
        ...router.query,
        q: newSearchQuery
    };

    if (!newUrlParams.q) {
        delete newUrlParams.q;
    }

    router.replace({
        pathname: router.pathname,
        query: newUrlParams
    }, null, {
        shallow: true
    });
}, 500);

export function SearchNavigation() {
    const router = useRouter();
    const [routerWasReady, setRouterWasReady] = useState(router.isReady);
    const { entity, ...query } = router.query;
    const { q: initialSearchQuery = "" } = query;

    const [inputSearchQuery, setInputSearchQuery] = useState("");

    const updateInputSearchQuery = (newInputSearchQuery: string) => {
        setInputSearchQuery(newInputSearchQuery);
        updateSearchQuery(router, newInputSearchQuery);
    };

    const inputRef = useRef<HTMLInputElement>();

    const onMountInput = useCallback((input: HTMLInputElement) => {
        // Only focus the input on desktop devices
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            input?.focus({
                preventScroll: true
            });
        }

        inputRef.current = input;
    }, []);

    useEffect(() => {
        const hotkeyListener = (event: KeyboardEvent) => {
            if (inputRef.current !== document.activeElement && ((event.key === "s" && event.ctrlKey) || (event.key === "/"))) {
                event.preventDefault();
                inputRef.current?.focus({
                    preventScroll: true
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        };

        window.addEventListener("keydown", hotkeyListener);

        return () => window.removeEventListener("keydown", hotkeyListener);
    }, []);

    if (router.isReady !== routerWasReady) {
        setRouterWasReady(router.isReady);
        setInputSearchQuery(initialSearchQuery as string);
        return null;
    }

    return <>
        <Text variant="h1">Search</Text>
        <StyledSearchOptions>
            <Input
                value={inputSearchQuery}
                onChange={updateInputSearchQuery}
                inputProps={{
                    ref: onMountInput,
                    spellCheck: false,
                    placeholder: "Search"
                }}
                resettable
                icon={faSearch}
            />
            <HorizontalScroll fixShadows>
                <Switcher selectedItem={entity as string || null}>
                    <SwitcherReset as={Link} prefetch={false} href={{ pathname: "/search", query }}/>
                    <SwitcherOption as={Link} prefetch={false} href={{ pathname: "/search/anime", query }} value="anime">Anime</SwitcherOption>
                    <SwitcherOption as={Link} prefetch={false} href={{ pathname: "/search/theme", query }} value="theme">Theme</SwitcherOption>
                    <SwitcherOption as={Link} prefetch={false} href={{ pathname: "/search/artist", query }} value="artist">Artist</SwitcherOption>
                    <SwitcherOption as={Link} prefetch={false} href={{ pathname: "/search/series", query }} value="series">Series</SwitcherOption>
                    <SwitcherOption as={Link} prefetch={false} href={{ pathname: "/search/studio", query }} value="studio">Studio</SwitcherOption>
                    <SwitcherOption as={Link} prefetch={false} href={{ pathname: "/search/playlist", query }} value="playlist">Playlist</SwitcherOption>
                </Switcher>
            </HorizontalScroll>
        </StyledSearchOptions>
    </>;
}
