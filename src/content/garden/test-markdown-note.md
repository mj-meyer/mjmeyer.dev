---
title: Test Markdown Formatting
publishDatetime: 2024-08-25T11:18:32Z
updateDatetime: 2024-08-25T11:18:32Z
description: This is just a test note for formatting
noteState: seedling
tags:
  - seedling
publish: true
incomingLinks:
  - test-for-now-page
  - test-stream-note
  - test-note-for-garden-two
outgoingLinks:
  - untitled-5
  - test-stream-note
---

# Comprehensive Markdown Example

This document showcases various Markdown syntax elements.

## Headers

# H1

## H2

### H3

#### H4

##### H5

###### H6

http://www.youtube.com/watch?v=Hoe-woAhq_k

## Twitter Test

<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">i had to use vscode for a day to get lambda breakpoints working again<br><br>i learned its debugger deviates a lot from the &quot;standard&quot; - you get way more than attaching chrome devtools<br><br>does anyone bother using a debugger in neovim?</p>&mdash; dax (@thdxr) <a href="https://twitter.com/thdxr/status/1830767036852523055?ref_src=twsrc%5Etfw">September 3, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
## Emphasis

_Italic text_ or _Italic text_
**Bold text** or **Bold text**
**_Bold and italic text_** or **_Bold and italic text_**
~~Strikethrough text~~

## Lists

### Unordered List

- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Ordered List

1. First item
2. Second item
3. Third item
   1. Subitem 3.1
   2. Subitem 3.2

### Task List

- [x] Completed task
- [ ] Uncompleted task

## Links

[Link text](https://www.example.com)
[Link with title](https://www.example.com "Link title")

## Images

![Alt text](/test-image.png)
![Alt text](https://example.com/image.jpg "Image title")

## Blockquotes

> This is a blockquote
>
> It can span multiple lines

> Nested blockquotes
>
> > Are also possible

## Code

Inline `code` has `back-ticks around` it.

```
Code blocks
are fenced
by three back-ticks
```

```javascript
// Language-specific syntax highlighting
function example() {
  console.log("Hello, world!");
}
```

## Horizontal Rules

---

---

---

## Tables

| Header 1     | Header 2     | Header 3     |
| ------------ | ------------ | ------------ |
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |

## Footnotes

Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.

## Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

## Abbreviations

The HTML specification is maintained by the W3C.

## Emojis (Note: support may vary)

:smile: :heart: :thumbsup:

## Diagrams (using Mermaid syntax, requires Mermaid support)

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

## Comments

[//]: # "This is a comment that won't be rendered"

## Escape Characters

\*This text is surrounded by literal asterisks\*
