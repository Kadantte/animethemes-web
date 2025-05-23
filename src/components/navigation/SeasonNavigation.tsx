import Link from "next/link";

import { Row } from "@/components/box/Flex";
import { Switcher, SwitcherOption } from "@/components/switcher/Switcher";
import { HorizontalScroll } from "@/components/utils/HorizontalScroll";
import type { YearDetailPageProps } from "@/pages/year/[year]";
import type { SeasonDetailPageProps } from "@/pages/year/[year]/[season]";

export function SeasonNavigation(props: YearDetailPageProps | SeasonDetailPageProps) {
    const { year } = props;

    return (
        <Row style={{ "--justify-content": "center" }}>
            <HorizontalScroll $fixShadows>
                <Switcher selectedItem={"season" in props ? props.season.value.toLowerCase() : null}>
                    {year.seasons.map((season) => (
                        <SwitcherOption key={season.value} asChild value={season.value.toLowerCase()}>
                            <Link href={`/year/${year.value}/${season.value.toLowerCase()}`}>{season.value}</Link>
                        </SwitcherOption>
                    ))}
                </Switcher>
            </HorizontalScroll>
        </Row>
    );
}
