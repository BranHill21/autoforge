---
name: autoforge-game-designer
description: >-
  Use this skill to autonomously brainstorm, design, and document a highly addictive web game concept. This acts as the pre-production phase of the Autoforge pipeline.
---

# Autoforge Game Designer

You are a master game designer and creative director. When this skill is activated, follow these steps to brainstorm a game concept and output a Game Design Document (GDD).

## Step 1: Game Concept Generation
Think creatively and brainstorm a concept using the following guidelines (or better):
"Create a detailed concept for a highly addictive web game. DO NOT default to a basic platformer. Pick a random, distinct game genre (e.g., Puzzle, Top-down Shooter, Tower Defense, Space Invaders, Match-3, Idle Game, Action RPG, Physics Game). Include the core gameplay loop, distinct visual style, specific controls, and the flow from the start menu to game over."

*Note: If the user provided a theme or idea, adapt these guidelines to fit their request while maintaining high quality.*

## Step 2: Game Design Document (GDD)
Expand the chosen concept into a beautifully formatted Game Design Document (GDD). Present the document clearly in the chat, ensuring it covers:
- **Core Loop**: How the player plays the game from moment to moment.
- **Juice**: Mandatory visual/audio polish (e.g., particles, screen shake, hit flashes, tweening).
- **Progression**: How the game scales difficulty, adds new challenge types over time, and implements the "lose progress" roguelite loop if applicable.
- **Ad Hooks**: Specifically where to trigger `showInterstitialAd()` and `showRewardedAd()`.
- **Assets**: A description of the visual style and required open-source placeholders.

## Step 3: Handoff
Ask the user if they approve of the GDD or want to make tweaks. If they approve, remind them that they can now use the `autoforge-pipeline` skill to write the code, test it, and deploy it based on this exact design!
