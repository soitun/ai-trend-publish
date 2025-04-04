import { Theme } from "@src/modules/md-converter/themes/types.ts";
import {
  ConverterFunc,
  MarkdownElement,
} from "@src/modules/md-converter/types/index.ts";
import { makeStyleText } from "@src/modules/md-converter/utils/index.ts";

export const headingConverter: ConverterFunc<MarkdownElement.Heading> = (
  styles: Theme,
  text: string,
  level: number,
) => {
  const tag = `h${
    Math.min(Math.max(level, 1), 6)
  }` as keyof (typeof styles)[MarkdownElement.Heading];
  return `<${tag} style="${
    makeStyleText(
      styles[MarkdownElement.Heading][tag],
    )
  }">${text}</${tag}>`;
};

export const headingConverterFactory = (styles: Theme) => {
  return (text: string, level: number) => headingConverter(styles, text, level);
};
