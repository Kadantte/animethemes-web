import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";

import type { Property } from "csstype";

import { Column } from "@/components/box/Flex";
import { Card } from "@/components/card/Card";
import { Text } from "@/components/text/Text";
import { TextLink } from "@/components/text/TextLink";
import { ConditionalWrapper } from "@/components/utils/ConditionalWrapper";
import { loadingAnimation } from "@/styles/mixins";
import withBasePath from "@/utils/withBasePath";

const StyledSummaryCard = styled(Card)`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;

    height: 64px;
    padding: 0 1rem 0 4px;
`;

const StyledCover = styled.img.attrs({
    loading: "lazy",
})<{
    $objectFit?: Property.ObjectFit;
    $backgroundColor?: Property.Background;
    $isLoading?: boolean;
    $isPlaceholder?: boolean;
}>`
    width: 48px;
    height: 64px;
    object-fit: ${(props) => props.$objectFit ?? "cover"};
    background: ${(props) => props.$backgroundColor};

    ${(props) =>
        props.$isPlaceholder
            ? css`
                  padding: 0.5rem;
                  object-fit: contain;
                  background-color: white;
              `
            : props.$isLoading
              ? loadingAnimation
              : null}
`;

const StyledBody = styled(Column)`
    flex: 1;
    justify-content: center;
    gap: 0.25rem;

    word-break: break-all;
`;

interface SummaryCardProps extends Omit<ComponentPropsWithoutRef<typeof StyledSummaryCard>, "title"> {
    title: string | ReactNode;
    description?: string | ReactNode;
    image?: string;
    imageProps?: ComponentPropsWithoutRef<typeof StyledCover>;
    to?: string;
    children?: ReactNode;
}

export function SummaryCard({ title, description, image, imageProps, to, children, ...props }: SummaryCardProps) {
    const [imageNotFound, setImageNotFound] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    return (
        <StyledSummaryCard {...props}>
            <ConditionalWrapper condition={!!to} wrap={(children) => <Link href={to as string}>{children}</Link>}>
                <StyledCover
                    alt="Cover"
                    src={(!imageNotFound && image) || withBasePath("/img/logo.svg")}
                    $isLoading={imageLoading}
                    $isPlaceholder={!image || imageNotFound}
                    loading="lazy"
                    {...imageProps}
                    onLoad={(event) => {
                        setImageLoading(false);
                        if (imageProps?.onLoad) {
                            imageProps.onLoad(event);
                        }
                    }}
                    onError={(event) => {
                        setImageNotFound(true);
                        setImageLoading(false);
                        if (imageProps?.onError) {
                            imageProps.onError(event);
                        }
                    }}
                />
            </ConditionalWrapper>
            <StyledBody>
                <Text maxLines={1} title={typeof title === "string" ? title : undefined}>
                    {typeof title === "string" && to ? <TextLink href={to}>{title}</TextLink> : title}
                </Text>
                {!!description && (
                    <Text variant="small" maxLines={1}>
                        {typeof description === "string" ? (
                            <SummaryCard.Description>{[description]}</SummaryCard.Description>
                        ) : (
                            description
                        )}
                    </Text>
                )}
            </StyledBody>
            {children}
        </StyledSummaryCard>
    );
}

type SummaryCardDescriptionProps = {
    children: Array<ReactNode>;
};

SummaryCard.Description = function SummaryCardDescription({ children }: SummaryCardDescriptionProps) {
    return (
        <>
            {children
                .filter((child) => child)
                .map((child, index, { length }) => (
                    <Text key={index} color="text-muted">
                        <span>{child}</span>
                        {index < length - 1 && <span> &bull; </span>}
                    </Text>
                ))}
        </>
    );
};
