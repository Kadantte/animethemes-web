import type { ComponentPropsWithoutRef } from "react";
import styled from "styled-components";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";

import type { MDXComponents } from "mdx/types";

import { Card } from "@/components/card/Card";
import { Text } from "@/components/text/Text";
import { TextLink } from "@/components/text/TextLink";
import theme from "@/theme";

const StyledMarkdown = styled.div`
    line-height: 1.75;
    word-break: break-word;

    & h1 {
        margin-bottom: 32px;
    }

    & h2 {
        margin-bottom: 24px;
        font-size: 1.2rem;
    }

    & h3 {
        margin-bottom: 16px;
    }

    & p + h2,
    & ul + h2,
    & ol + h2,
    & ${Card} + h2,
    & pre + h2,
    & table + h2 {
        margin-top: 48px;
    }

    & p + h3,
    & ul + h3,
    & ol + h3,
    & ${Card} + h3,
    & pre + h3,
    & table + h3 {
        margin-top: 32px;
    }

    & p,
    & ul,
    & ol {
        margin-top: 0;
        margin-bottom: 16px;
    }

    & ul ul,
    & ol ol {
        margin-bottom: 0;
    }

    & table {
        width: 100%;
        table-layout: auto;
        text-align: left;
        border-collapse: collapse;
    }

    & thead {
        border-bottom: 1px solid ${theme.colors["text-muted"]};

        & th {
            font-weight: 600;
            vertical-align: bottom;
            padding-left: 8px;
            padding-right: 8px;
            padding-bottom: 8px;

            &:first-child {
                padding-left: 0;
            }

            &:last-child {
                padding-right: 0;
            }
        }
    }

    & tbody tr {
        border-bottom: 1px solid ${theme.colors["text-disabled"]};

        &:last-child {
            border-bottom-width: 0;
        }
    }

    & tbody td {
        vertical-align: baseline;
        padding: 8px;

        &:first-child {
            padding-left: 0;
        }

        &:last-child {
            padding-right: 0;
        }
    }

    & pre {
        margin-bottom: 16px;
        overflow-x: auto;
    }

    & pre > code {
        display: block;
        min-width: 100%;
        width: max-content;
        padding: 16px;
    }

    & ${Card} {
        margin-bottom: 16px;
    }

    & img {
        border-radius: ${theme.scalars.borderRadiusCard};
    }
`;

interface MarkdownProps {
    source: MDXRemoteSerializeResult;
    components?: MDXComponents;
}

export function Markdown({ source, components = {} }: MarkdownProps) {
    return (
        <StyledMarkdown>
            <MDXRemote
                {...source}
                components={{
                    a: (props: ComponentPropsWithoutRef<"a">) => {
                        const { href } = props;

                        if (href?.startsWith("/")) {
                            return <TextLink href={href} {...props} />;
                        }

                        return <Text as="a" link href={href} {...props} />;
                    },
                    h1: (props: ComponentPropsWithoutRef<typeof Text>) => <Text variant="h1" {...props} />,
                    h2: (props: ComponentPropsWithoutRef<typeof Text>) => <Text variant="h2" {...props} />,
                    h3: (props: ComponentPropsWithoutRef<typeof Text>) => <Text variant="h2" as="h3" {...props} />,
                    code: (props: ComponentPropsWithoutRef<typeof Text>) => <Text variant="code" {...props} />,
                    Card,
                    ...components,
                }}
            />
        </StyledMarkdown>
    );
}
