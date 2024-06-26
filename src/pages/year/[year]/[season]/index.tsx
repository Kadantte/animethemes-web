import type { GetStaticPaths, GetStaticProps } from "next";

import gql from "graphql-tag";
import { capitalize } from "lodash-es";
import type { ParsedUrlQuery } from "querystring";

import { Column } from "@/components/box/Flex";
import { AnimeSummaryCard } from "@/components/card/AnimeSummaryCard";
import { SEO } from "@/components/seo/SEO";
import { Text } from "@/components/text/Text";
import type {
    SeasonDetailPageAllQuery,
    SeasonDetailPageQuery,
    SeasonDetailPageQueryVariables,
} from "@/generated/graphql";
import { fetchData } from "@/lib/server";
import fetchStaticPaths from "@/utils/fetchStaticPaths";
import type { SharedPageProps } from "@/utils/getSharedPageProps";
import getSharedPageProps from "@/utils/getSharedPageProps";
import type { RequiredNonNullable } from "@/utils/types";

const seasonOrder = ["winter", "spring", "summer", "fall"];

export interface SeasonDetailPageProps extends SharedPageProps, RequiredNonNullable<SeasonDetailPageQuery> {}

interface SeasonDetailPageParams extends ParsedUrlQuery {
    year: string;
    season: string;
}

export default function SeasonDetailPage({ season, year }: SeasonDetailPageProps) {
    const animeList = season.anime.filter((anime) => anime.name).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <>
            <SEO title={`${capitalize(season.value)} ${year.value}`} />
            <Text variant="h2">
                {`Anime from ${season.value} of ${year.value}`}
                <Text color="text-disabled"> ({animeList.length})</Text>
            </Text>
            <Column style={{ "--gap": "16px" }}>
                {animeList.map((anime) => (
                    <AnimeSummaryCard key={anime.slug} anime={anime} expandable />
                ))}
            </Column>
        </>
    );
}

export const getStaticProps: GetStaticProps<SeasonDetailPageProps, SeasonDetailPageParams> = async ({ params }) => {
    const { data, apiRequests } = await fetchData<SeasonDetailPageQuery, SeasonDetailPageQueryVariables>(
        gql`
            ${AnimeSummaryCard.fragments.anime}
            ${AnimeSummaryCard.fragments.expandable}

            query SeasonDetailPage($year: Int = 0, $season: String!) {
                year(value: $year) {
                    value
                    seasons {
                        value
                    }
                }
                season(year: $year, value: $season) {
                    value
                    anime {
                        slug
                        ...AnimeSummaryCardAnime
                        ...AnimeSummaryCardAnimeExpandable
                    }
                }
                yearAll {
                    value
                }
            }
        `,
        params && {
            year: +params.year,
            season: params.season,
        },
    );

    if (!data.year || !data.season) {
        return {
            notFound: true,
        };
    }

    data.year.seasons.sort(
        (a, b) => seasonOrder.indexOf(a.value.toLowerCase()) - seasonOrder.indexOf(b.value.toLowerCase()),
    );
    data.yearAll.sort((a, b) => a.value - b.value);

    return {
        props: {
            ...getSharedPageProps(apiRequests),
            season: data.season,
            year: data.year,
            yearAll: data.yearAll,
        },
        // Revalidate after 3 hours (= 10800 seconds).
        revalidate: 10800,
    };
};

export const getStaticPaths: GetStaticPaths<SeasonDetailPageParams> = async () => {
    return fetchStaticPaths(async () => {
        const { data } = await fetchData<SeasonDetailPageAllQuery>(gql`
            query SeasonDetailPageAll {
                yearAll {
                    value
                    seasons {
                        value
                    }
                }
            }
        `);

        return data.yearAll.flatMap((year) =>
            year.seasons.map((season) => ({
                params: {
                    year: String(year.value),
                    season: season.value,
                },
            })),
        );
    });
};
