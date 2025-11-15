export const kebabToCamel = (str: string) => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const transform = (template: string, { svg }: { svg: string }) => {
  // TODO: transform the svg code to svg jsx with svgr and svgo
  const editable = svg
    .toString()
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/g, "");

  const content = editable.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] || "";

  const processed = content
    .replace(/fill="(?!none)[^"]*"/g, "")
    .replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"')
    .replace(/(?!data-)([a-z-]+)="([^"]*)"/g, (_, key, value) => {
      const camelAttributeKey = kebabToCamel(key);
      return `${camelAttributeKey}="${value}"`;
    });

  //TODO: get <title> if it exists in svg content
  //TODO: move strokeWidth to <svg> to be styled with tailwind

  return template.replace("__SVG_CONTENT__", processed.trim());
};
