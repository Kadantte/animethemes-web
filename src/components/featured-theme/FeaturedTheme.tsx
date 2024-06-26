import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

import gql from "graphql-tag";

import { ThemeSummaryCard } from "@/components/card/ThemeSummaryCard";
import type { FeaturedThemeThemeFragment } from "@/generated/graphql";
import useCompatability from "@/hooks/useCompatability";
import useSetting from "@/hooks/useSetting";
import { fetchRandomGrill } from "@/lib/client/randomGrill";
import theme from "@/theme";
import { VIDEO_URL } from "@/utils/config";
import createVideoSlug from "@/utils/createVideoSlug";
import extractImages from "@/utils/extractImages";
import { FeaturedThemePreview } from "@/utils/settings";

const slowPan = keyframes`
    from {
        object-position: top;
    }
    50% {
        object-position: bottom;
    }
`;

const slideIn = keyframes`
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(10%);
    }
`;

const StyledWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    height: 200px;

    position: relative;

    @media (max-width: ${theme.breakpoints.mobileMax}) {
        margin-inline-start: -16px;
        margin-inline-end: -16px;
        margin-bottom: 32px;
    }
`;

const StyledOverflowHidden = styled(Link)`
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
    overflow: hidden;

    @media (max-width: ${theme.breakpoints.mobileMax}) {
        border-radius: 0;
    }
`;

const StyledCenter = styled.div`
    position: absolute;

    width: 400px;

    @media (max-width: ${theme.breakpoints.mobileMax}) {
        width: auto;
        left: 16px;
        right: 16px;
        bottom: 0;
        transform: translateY(50%);
    }
`;

const StyledVideo = styled.video`
    width: 100%;
    filter: blur(5px);
    background-color: ${theme.colors["solid-on-card"]};
`;

const StyledCover = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(5px);
    animation: ${slowPan} 60s ease-in-out infinite;
`;

const StyledGrillContainer = styled.div`
    position: absolute;

    height: 130%;
    bottom: 0;
    right: 32px;
    overflow: hidden;

    @media (max-width: ${theme.breakpoints.mobileMax}) {
        right: 0;
    }
`;

const StyledGrill = styled.img`
    max-width: 300px;
    height: 100%;
    object-fit: contain;
    object-position: bottom;
    animation: ${slideIn} 2s 2s backwards cubic-bezier(0.34, 1.56, 0.64, 1);

    transition: transform 1s;
    transform: translateY(10%);

    &:hover {
        transform: none;
    }
`;

const Box = styled.div``;

interface FeaturedThemeProps {
    theme: FeaturedThemeThemeFragment;
    hasGrill?: boolean;
    card?: ReactNode;
    onPlay?(): void;
}

export function FeaturedTheme({ theme, hasGrill = true, card, onPlay }: FeaturedThemeProps) {
    const [grill, setGrill] = useState<string | null>(null);
    const [featuredThemePreview] = useSetting(FeaturedThemePreview);

    useEffect(() => {
        if (hasGrill) {
            fetchRandomGrill().then(setGrill);
        }
    }, [hasGrill]);

    const FeaturedThemeWrapper = featuredThemePreview !== FeaturedThemePreview.DISABLED ? StyledWrapper : Box;

    const featuredThemeSummaryCard =
        featuredThemePreview !== FeaturedThemePreview.DISABLED ? (
            <StyledCenter>{card ?? <ThemeSummaryCard theme={theme} />}</StyledCenter>
        ) : (
            card ?? <ThemeSummaryCard theme={theme} />
        );

    return (
        <FeaturedThemeWrapper>
            <FeaturedThemeBackground theme={theme} onPlay={onPlay} />
            {featuredThemePreview !== FeaturedThemePreview.DISABLED && grill && (
                <StyledGrillContainer>
                    <StyledGrill src={grill} />
                </StyledGrillContainer>
            )}
            {featuredThemeSummaryCard}
        </FeaturedThemeWrapper>
    );
}

function FeaturedThemeBackground({ theme, onPlay }: FeaturedThemeProps) {
    const [featuredThemePreview] = useSetting(FeaturedThemePreview);
    const { canPlayVideo } = useCompatability();
    const [fallbackToCover, setFallbackToCover] = useState(false);
    const { smallCover: featuredCover } = extractImages(theme.anime);

    if (!theme.anime || !theme.entries.length) {
        return null;
    }

    const entry = theme.entries[0];

    if (!entry.videos.length) {
        return null;
    }

    const video = entry.videos[0];
    const videoSlug = createVideoSlug(theme, entry, video);

    const href = `/anime/${theme.anime.slug}/${videoSlug}`;

    if (featuredThemePreview === FeaturedThemePreview.VIDEO && canPlayVideo && !fallbackToCover) {
        return (
            <StyledOverflowHidden href={href} onClick={onPlay}>
                <StyledVideo key={video.basename} autoPlay muted loop onError={() => setFallbackToCover(true)}>
                    <source src={`${VIDEO_URL}/${video.basename}`} type={`video/webm; codecs="vp8, vp9, opus`} />
                </StyledVideo>
            </StyledOverflowHidden>
        );
    } else if (featuredThemePreview !== FeaturedThemePreview.DISABLED) {
        return (
            <StyledOverflowHidden href={href} onClick={onPlay}>
                <StyledCover src={featuredCover} />
            </StyledOverflowHidden>
        );
    }

    return null;
}

FeaturedTheme.fragments = {
    theme: gql`
        ${ThemeSummaryCard.fragments.theme}
        ${extractImages.fragments.resourceWithImages}

        fragment FeaturedThemeTheme on Theme {
            ...ThemeSummaryCardTheme
            anime {
                ...extractImagesResourceWithImages
            }
            entries {
                videos {
                    basename
                }
            }
        }
    `,
};
