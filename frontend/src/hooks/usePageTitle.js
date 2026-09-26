import { useEffect } from 'react';

const SITE = 'Isa Moh Mobile Shop';

/**
 * Sets the document <title> for the current page.
 * Usage: usePageTitle('My Page')  →  "My Page | Isa Moh Mobile Shop"
 *        usePageTitle()           →  "Isa Moh Mobile Shop"
 */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : SITE;
    // Reset to site name when component unmounts
    return () => { document.title = SITE; };
  }, [title]);
}
