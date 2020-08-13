# Anki for VSCode (Beta)

This is a VSCode plugin for interacting and sending cards to Anki.  
It uses AnkiConnect for communication so you will need this plugin installed and running before installing the VSCode extension.

## Requirements

- Anki >= 2.1.21
- [Anki Connect](https://ankiweb.net/shared/info/2055492159) >= 2020-07-13
- VSCode >= 1.47

## Features

### Send to deck

If you're writing up Markdown files and want to send some Q & As to a deck you can do that quite easily with the `Anki: Send To Deck` command.  
It will send to the default deck "notes" but you can change this in the settings.  
This is useful if you want a "Daily" deck where you can put daily notes into.
This plugin will also add a tag to each card based of the title, so you can still organise cards within a deck.

Here's an example

![image](./docs/img/sendToAnki.gif)

### Send to own deck

Very similar to the above but will send to a new deck of the Markdown title.  
In this example we realise that we want to send this content to its own deck, that's no problem, use `Anki: Send To Own Deck`

Here's an example

![image](./docs/img/sendToAnkiOwnDeck.gif)

### Explorer

Navigate through cards and template CSS.  
Currently this is in a readonly state but future releases should enable editing.

![image](./docs/img/ankiExplorer2.gif)

## Cards

By default, Anki for VSCode splits cards by `##` headline. For example, below markdown will generate 2 cards where headlines will be on the front side and its description - on the back.

```
## What's the Markdown?

Markdown is a lightweight markup language with plain-text-formatting syntax.
Its design allows it to be converted to many output formats,
but the original tool by the same name only supports HTML.

## Who created Markdown?

John Gruber created the Markdown language in 2004 in collaboration with
Aaron Swartz on the syntax.

```

If you want to have multiple lines on the card's front side - use `%` symbol for splitting front and back sides:

```
## YAGNI

Describe this acronym and why it's so important.

%

"You aren't gonna need it" (YAGNI) is a principle of extreme programming
(XP) that states a programmer should not add functionality until deemed
necessary.

```

When parsing only one markdown file, the title of the deck could be generated based on the top-level headline (`#`).

## Tags

Cards can have tags in their markdown sources. For adding tags to cart it should follow some rules:

- tags start from a new line
- only one line with tags per card
- a tag should be written in the link format
- tag (link text) should start from `#` symbol

uses `'^\\[#(.*)\\]'` pattern for searching tags. This pattern could be overwritten by specifying custom settings. The source file in the tag link is optional.

The below example will generate a card with 3 tags: _algorithms_, _OOP_, and _binary_tree_.

```
## Binary tree

In computer science, a binary tree is a tree data structure in which each node has at most two children, which are referred to as the left child and the right child.

[#algorithms](./algorityms.md) [#OOP]() [#binary tree]()
```

## Code and syntax highlighting

Syntax highlighting should work out the box.
Code blocks can be written with and without specifying a language name:

<pre>
```java
public static void main(String[] args) {
  System.out.println("Hello, World!");
}
```
</pre>
<pre>
```
echo "Hello, World!"
```
</pre>

The last code block will be treated by MDAnki as Bash code. The default language can be configured by specifying `--config` with an appropriate **defaultLanguage** [setting](../src/configs/settings.js).

**Note!** Creating a block without language name is not fully supported and should be eliminated in usage. Take a look at this:

```bash
echo "Code block with language name"
```

```
echo "Code block without language name"
```

## Extension Commands

- `Anki: Sync Anki`: This will run Sync on your Anki Instance
- `Anki: Anki: Send To Deck`: This will attempt to send your (markdown) card into Anki - More info above
- `Anki: Anki: Send To Own Deck`: Sends to a new deck using the Markdown's title as a deck name
- `Anki: Force Re-install`: This will attempt to re-setup the extension on Anki (Anki needs to be running). You shouldn't need this unless there's an issue.

## Extension Settings

- `anki.defaultDeck`: Default deck to send notes to. | _notes_
- `anki.md.createTagForTitle`: Send tag with cards? (when using default deck). | _true_
- `anki.api.hostname`: API Hostname. | _127.0.0.1_
- `anki.api.port`: API Port. | _8765_
- `anki.api.schema`: Schema. | _http_
- `anki.api.port`: API Port. | _8765_

I don't recommend messing with the following settings

- `anki.md.card.separator`: Regex used for separating cards
- `anki.md.card.frontBackSeparator`: Regex used for separating front / back
- `anki.md.card.tagPattern`: Regex used to scrape tags
- `anki.md.deck.titleSeparator`: Regex to remove the top title from cards
