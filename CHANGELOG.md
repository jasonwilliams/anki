# Change Log

All notable changes to the "anki" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.2.7]

- Fix bug that LaTeX curly brackets do not convert correctly [#63](https://github.com/jasonwilliams/anki/issues/63)
- Fix bug when user sets the `saveStrategy` to `useDirStructure`, the actual deck does not match the displayed deck when executing the `Send To Deck` command

## [1.2.6]

- Add a new feature: Use the current directory structure as deck name [#71](https://github.com/jasonwilliams/anki/issues/71)
- Update dependencies

## [1.2.5]

- Don't nag if Anki is not running. This reduces annoying pop-ups if user is just looking at a markdown file unrelated to Anki

## [1.2.3]

- Throw an error if the template is not installed correctly, allowing the user to try again.

## [1.2.1]

- Added more diagnostics and logging surrounding the bug of missing note types

## [1.2.0]

- Added support for Math/Latex syntax

## [1.0.4]

- Fixed bug where various assets were ignored in production builds

## [1.0.3]

- Remove single-line check, this caused a regression with Cloze [#26](https://github.com/jasonwilliams/anki/issues/26)

## [1.0.2]

- Fixed a bug where the deck name was including all content underneath on "Send To Own Deck". [#25](https://github.com/jasonwilliams/anki/pull/25) (thanks @MicahGV)

## [1.0.1]

- Fix bug where non-ascii characters for media was not being sent [#22](https://github.com/jasonwilliams/anki/issues/22)
- The extension bundle is now smaller due to dropped support of older Node versions

## [1.0.0]

- Addition of unit tests for card parser
- Fixed small bug which prevents cards being created if no body

## [0.3.0]

- Added support for images
- Fixed potential bug which creates multiple templates

## [0.2.0]

- Support for Cloze deletions, you just need to use Cloze syntax in your card title
- Fixed a bug where errors weren't properly emitted

## [0.1.0]

- Added a command that allows users to force an install (in case initial install fails)
- Anki Explorer now includes Templates!
- Anki Explorer now uses Anki icons!
- Anki Explorer shows "read-only" data such as CSS for templates and Card details in JSON
- Various bug fixes

## [Unreleased]

- Initial release
