import React, { useState } from "react";
import styled from "styled-components";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import gql from "graphql-tag";
import type { ParsedUrlQuery } from "querystring";

import { Column } from "@/components/box/Flex";
import { Card } from "@/components/card/Card";
import { ThemeDetailCard } from "@/components/card/ThemeDetailCard";
import { SidebarContainer } from "@/components/container/SidebarContainer";
import { DescriptionList } from "@/components/description-list/DescriptionList";
import { ExternalLink } from "@/components/external-link/ExternalLink";
import { AnimeThemeFilter } from "@/components/filter/AnimeThemeFilter";
import { CoverImage } from "@/components/image/CoverImage";
import { Markdown } from "@/components/markdown/Markdown";
import { SEO } from "@/components/seo/SEO";
import { Text } from "@/components/text/Text";
import { HeightTransition } from "@/components/utils/HeightTransition";
import type { AnimeDetailPageAllQuery, AnimeDetailPageQuery, AnimeDetailPageQueryVariables } from "@/generated/graphql";
import { fetchData } from "@/lib/server";
import {
    either,
    resourceAsComparator,
    resourceSiteComparator,
    seriesNameComparator,
    studioNameComparator,
} from "@/utils/comparators";
import extractImages from "@/utils/extractImages";
import fetchStaticPaths from "@/utils/fetchStaticPaths";
import type { SharedPageProps } from "@/utils/getSharedPageProps";
import getSharedPageProps from "@/utils/getSharedPageProps";
import { serializeMarkdownSafe } from "@/utils/serializeMarkdown";
import type { RequiredNonNullable } from "@/utils/types";

const StyledList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;

    text-align: center;
`;

interface AnimeDetailPageProps extends SharedPageProps, RequiredNonNullable<AnimeDetailPageQuery> {
    synopsisMarkdownSource: MDXRemoteSerializeResult | null;
}

interface AnimeDetailPageParams extends ParsedUrlQuery {
    animeSlug: string;
}

export default function AnimeDetailPage({ anime, synopsisMarkdownSource }: AnimeDetailPageProps) {
    const [collapseSynopsis, setCollapseSynopsis] = useState(true);
    const { largeCover } = extractImages(anime);

    return (
        <>
            <SEO title={anime.name} image={largeCover} />
            <Text variant="h1">{anime.name}</Text>
            <SidebarContainer>
                <Column style={{ "--gap": "24px" }}>
                    <CoverImage resourceWithImages={anime} alt={`Cover image of ${anime.name}`} />
                    <DescriptionList>
                        {anime.synonyms.length ? (
                            <DescriptionList.Item title="Alternative Titles">
                                <StyledList>
                                    {anime.synonyms.map((synonym) => (
                                        <Text key={synonym.text}>{synonym.text}</Text>
                                    ))}
                                </StyledList>
                            </DescriptionList.Item>
                        ) : null}
                        <DescriptionList.Item title="Premiere">
                            <Text
                                as={Link}
                                href={`/year/${anime.year}${anime.season ? `/${anime.season.toLowerCase()}` : ""}`}
                                link
                            >
                                {(anime.season ? anime.season + " " : "") + anime.year}
                            </Text>
                        </DescriptionList.Item>
                        {anime.series?.length ? (
                            <DescriptionList.Item title="Series">
                                <StyledList>
                                    {anime.series.sort(seriesNameComparator).map((series) => (
                                        <Text key={series.slug} as={Link} href={`/series/${series.slug}`} link>
                                            {series.name}
                                        </Text>
                                    ))}
                                </StyledList>
                            </DescriptionList.Item>
                        ) : null}
                        {anime.media_format ? (
                            <DescriptionList.Item title="Format">{anime.media_format}</DescriptionList.Item>
                        ) : null}
                        {anime.studios?.length ? (
                            <DescriptionList.Item title="Studios">
                                <StyledList>
                                    {anime.studios.sort(studioNameComparator).map((studio) => (
                                        <Text key={studio.slug} as={Link} href={`/studio/${studio.slug}`} link>
                                            {studio.name}
                                        </Text>
                                    ))}
                                </StyledList>
                            </DescriptionList.Item>
                        ) : null}
                        {anime.resources?.length ? (
                            <DescriptionList.Item title="Links">
                                <StyledList>
                                    {anime.resources
                                        .sort(either(resourceSiteComparator).or(resourceAsComparator).chain())
                                        .map((resource) => (
                                            <ExternalLink key={resource.link} href={resource.link}>
                                                {resource.site}
                                                {!!resource.as && ` (${resource.as})`}
                                            </ExternalLink>
                                        ))}
                                </StyledList>
                            </DescriptionList.Item>
                        ) : null}
                    </DescriptionList>
                </Column>
                <Column style={{ "--gap": "24px" }}>
                    {!!synopsisMarkdownSource && (
                        <>
                            <Text variant="h2">Synopsis</Text>
                            <Card $hoverable onClick={() => setCollapseSynopsis(!collapseSynopsis)}>
                                <HeightTransition>
                                    <Text as="div" maxLines={collapseSynopsis ? 2 : undefined}>
                                        <Markdown source={synopsisMarkdownSource} />
                                    </Text>
                                </HeightTransition>
                            </Card>
                        </>
                    )}
                    <Text variant="h2">
                        Themes
                        <Text color="text-disabled"> ({anime.themes?.length || 0})</Text>
                    </Text>
                    {anime.themes?.length ? (
                        <AnimeThemeFilter themes={anime.themes.map((theme) => ({ ...theme, anime }))} />
                    ) : (
                        <Text as="p">There are no themes for this anime, yet.</Text>
                    )}
                </Column>
            </SidebarContainer>
        </>
    );
}

AnimeDetailPage.fragments = {
    anime: gql`
        ${extractImages.fragments.resourceWithImages}
        ${ThemeDetailCard.fragments.theme}

        fragment AnimeDetailPageAnime on Anime {
            ...extractImagesResourceWithImages
            slug
            name
            season
            year
            synopsis
            media_format
            synonyms {
                text
            }
            series {
                slug
                name
            }
            studios {
                slug
                name
            }
            resources {
                site
                link
                as
            }
            themes {
                ...ThemeDetailCardTheme
            }
        }
    `,
};

const buildTimeCache: Map<string, AnimeDetailPageQuery> = new Map();

export const getStaticProps: GetStaticProps<AnimeDetailPageProps, AnimeDetailPageParams> = async ({ params }) => {
    let data = params ? buildTimeCache.get(params.animeSlug) : null;
    let apiRequests = 0;

    if (!data) {
        ({ data, apiRequests } = await fetchData<AnimeDetailPageQuery, AnimeDetailPageQueryVariables>(
            gql`
                ${AnimeDetailPage.fragments.anime}

                query AnimeDetailPage($animeSlug: String!) {
                    anime(slug: $animeSlug) {
                        ...AnimeDetailPageAnime
                    }
                }
            `,
            params,
        ));
    }

    if (!data.anime) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            ...getSharedPageProps(apiRequests),
            anime: data.anime,
            synopsisMarkdownSource: data.anime.synopsis
                ? (await serializeMarkdownSafe(data.anime.synopsis)).source
                : null,
        },
        // Revalidate after 1 hour (= 3600 seconds).
        revalidate: 3600,
    };
};

export const getStaticPaths: GetStaticPaths<AnimeDetailPageParams> = () => {
    return fetchStaticPaths(async () => {
        const { data } = await fetchData<AnimeDetailPageAllQuery>(gql`
            ${AnimeDetailPage.fragments.anime}

            query AnimeDetailPageAll {
                animeAll {
                    ...AnimeDetailPageAnime
                }
            }
        `);

        data.animeAll.forEach((anime) => buildTimeCache.set(anime.slug, { anime }));

        return data.animeAll.map((anime) => ({
            params: {
                animeSlug: anime.slug,
            },
        }));
    });
};
