---
name: autoforge-pipeline
description: >-
  Use this skill when the user asks you to execute the autoforge pipeline, or build a game autonomously using the Autoforge workflow.
---

# Autoforge Autonomous Pipeline

You are executing the Autoforge pipeline. You MUST follow these steps exactly. You MUST NOT STOP until all steps are complete or the user explicitly interrupts. 

## Step 1: Concept & Planning
1. Ask the user what kind of game they want to build (if they haven't provided a prompt).
2. Read the project rules from `kaboom_rules.md`.
3. Plan out the game features, components, and logic based on the user's prompt and the rules.

## Step 2: Code Generation
1. Write the complete, single-file JavaScript game code.
2. Edit `game-template/main.js` using your file editing tools to insert the code.
3. Ensure it includes `import kaboom from 'kaboom';` and `kaboom({ width: 800, height: 600, letterbox: true });`.

## Step 3: Local QA & Self-Healing
1. Run the headless browser tests by executing the following command in the terminal:
   `python qa_tester.py`
2. Wait for the command to complete and review the output.
3. If the command outputs `❌ QA Failed`, you MUST carefully analyze the error logs, edit `game-template/main.js` to fix the bugs, and repeat Step 3 until the QA test passes with `✅ QA Passed`. Do not proceed to Step 4 until the test passes.

## Step 4: Playability & Bounds Review
1. Review the current code in `game-template/main.js`.
2. Check strictly for unbeatable states, unwinnable scenarios, missing win-conditions, math/bounds overflows (e.g., generating more items than can physically fit in a grid or on screen), or soft-locks.
3. If you find any logic flaws, edit `game-template/main.js` to fix them.
4. If you made any changes in this step, you MUST return to **Step 3: Local QA & Self-Healing** to ensure your changes didn't break the code.

## Step 5: Generate Instructions
1. Review the final game code.
2. Write a short, engaging description and instructions manual suitable for an itch.io page (include a summary, how to play, and controls).
3. Write this text to `game-template/instructions.txt`.

## Step 6: GitHub Deployment
1. Run the following commands in the terminal:
   - `git add .`
   - `git commit -m "Auto-Deploy: <Game Name>"`
   - `git push origin main`
2. Notify the user that the pipeline is complete and the game has been successfully deployed!
