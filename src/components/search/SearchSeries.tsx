import { useState } from "react";

import gql from "graphql-tag";

import { SummaryCard } from "@/components/card/SummaryCard";
import { SearchEntity } from "@/components/search/SearchEntity";
import { SearchFilterFirstLetter } from "@/components/search-filter/SearchFilterFirstLetter";
import { SearchFilterSortBy } from "@/components/search-filter/SearchFilterSortBy";
import type { SearchSeriesQuery, SearchSeriesQueryVariables } from "@/generated/graphql";
import useFilterStorage from "@/hooks/useFilterStorage";
import { fetchDataClient } from "@/lib/client";

const initialFilter = {
    firstLetter: null,
    sortBy: "name",
};

interface SearchSeriesProps {
    searchQuery?: string;
}

export function SearchSeries({ searchQuery }: SearchSeriesProps) {
    const { filter, updateFilter, bindUpdateFilter } = useFilterStorage("filter-series", {
        ...initialFilter,
        sortBy: searchQuery ? null : initialFilter.sortBy,
    });
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

    if (!searchQuery && filter.sortBy === null) {
        updateFilter("sortBy", initialFilter.sortBy);
        return null;
    }

    if (searchQuery !== prevSearchQuery) {
        // Check if user is switching from non-searching to searching
        if (searchQuery && !prevSearchQuery) {
            updateFilter("sortBy", null);
        }

        setPrevSearchQuery(searchQuery);
        return null;
    }

    return (
        <SearchEntity<SearchSeriesQuery["searchSeries"]["data"][number]>
            entity="series"
            searchArgs={{
                query: searchQuery,
                filters: {
                    "name-like": filter.firstLetter ? `${filter.firstLetter}%` : null,
                },
                sortBy: filter.sortBy,
            }}
            fetchResults={async (searchArgs) => {
                const { data } = await fetchDataClient<SearchSeriesQuery, SearchSeriesQueryVariables>(
                    gql`
                        query SearchSeries($args: SearchArgs!) {
                            searchSeries(args: $args) {
                                data {
                                    slug
                                    name
                                }
                                nextPage
                            }
                        }
                    `,
                    { args: searchArgs },
                );

                return data.searchSeries;
            }}
            renderResult={(series) => (
                <SummaryCard key={series.slug} title={series.name} description="Series" to={`/series/${series.slug}`} />
            )}
            filters={
                <>
                    <SearchFilterFirstLetter value={filter.firstLetter} setValue={bindUpdateFilter("firstLetter")} />
                    <SearchFilterSortBy value={filter.sortBy} setValue={bindUpdateFilter("sortBy")}>
                        {searchQuery ? (
                            <SearchFilterSortBy.Option value={null}>Relevance</SearchFilterSortBy.Option>
                        ) : null}
                        <SearchFilterSortBy.Option value="name">A ➜ Z</SearchFilterSortBy.Option>
                        <SearchFilterSortBy.Option value="-name">Z ➜ A</SearchFilterSortBy.Option>
                        <SearchFilterSortBy.Option value="-created_at">Last Added</SearchFilterSortBy.Option>
                    </SearchFilterSortBy>
                </>
            }
        />
    );
}
