import { visit } from 'unist-util-visit'
import type { Element } from 'hast'
import { toString } from 'hast-util-to-string'
import { slugifyStr } from './slugify'

export function rehypeUnpublishedLinks() {
  return (tree: any) => {
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName === 'a' && 
        node.properties?.href && 
        typeof node.properties.href === 'string' && 
        node.properties.href.includes('/unpublished')
      ) {
        // Get the text content of the link
        const linkText = toString(node)
        
        // Add the query parameter with slugified link text
        const slugifiedText = slugifyStr(linkText)
        node.properties.href = `${node.properties.href}?note=${slugifiedText}`
        
        // Add the class to existing classes if any
        const existingClasses = (node.properties.className || []) as string[]
        node.properties.className = [...existingClasses, 'unpublished-link']
      }
    })
  }
} 