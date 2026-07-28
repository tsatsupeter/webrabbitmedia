// Loaded through Vite SSR by prerender-docs.mjs so the .jsx docs sections
// compile. Renders every docs page from the registry to static HTML.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { groups } from '../src/pages/docs/registry'

export function renderAll() {
  const pages = []
  for (const group of groups) {
    for (const item of group.items) {
      pages.push({
        group: group.label,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        html: renderToStaticMarkup(
          createElement(MemoryRouter, null, createElement(item.Component)),
        ),
      })
    }
  }
  return pages
}
