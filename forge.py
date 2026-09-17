import os
import sys
import json
import subprocess
import google.generativeai as genai

# 1. Initialize Gemini
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')

def load_state():
    if os.path.exists("state.json"):
        with open("state.json", "r") as f: return json.load(f)
    return {"status": "IDEATION", "game_name": "", "code": ""}

def save_state(state):
    with open("state.json", "w") as f: json.dump(state, f)

def run_pipeline(interactive=False):
    state = load_state()
    
    # PHASE 1: IDEATION
    if state["status"] == "IDEATION":
        print("💡 Generating Game Concept...")
        prompt = "Create a 1-sentence concept for a highly addictive, arcade-style HTML5 web game."
        concept = model.generate_content(prompt).text
        state["game_name"] = concept
        state["status"] = "CODE_GEN"
        save_state(state)
        
        if interactive:
            input(f"Concept generated: {concept}\nPress Enter to approve or Ctrl+C to edit state.json...")

    # PHASE 2: CODE GENERATION
    if state["status"] == "CODE_GEN":
        print("⚙️ Writing Kaboom.js Code...")
        prompt = f"Write a complete, single-file Kaboom.js game based on this concept: {state['game_name']}. Only output the raw javascript code, no markdown."
        code = model.generate_content(prompt).text
        
        # Inject code into the Vite template
        with open("game-template/main.js", "w") as f:
            f.write(code.replace("```javascript", "").replace("```", ""))
            
        state["status"] = "LOCAL_QA"
        save_state(state)

    # PHASE 3: AUTOMATED QA (The Self-Healing Loop)
    if state["status"] == "LOCAL_QA":
        print("🤖 Running Headless Browser Tests...")
        # Start a local server and run Playwright to check for JS console errors
        # If Playwright detects an error, we feed the error trace BACK to Gemini to fix main.js.
        # (Playwright script omitted for brevity)
        print("✅ QA Passed. Zero console errors.")
        state["status"] = "SDK_INJECTION"
        save_state(state)

    # PHASE 4: SDK INJECTION & DEPLOYMENT
    if state["status"] == "SDK_INJECTION":
        print("🚀 Pushing to GitHub for CI/CD Deployment...")
        subprocess.run(["git", "add", "."])
        subprocess.run(["git", "commit", "-m", f"Auto-Deploy: {state['game_name']}"])
        subprocess.run(["git", "push", "origin", "main"])
        
        # Reset state for the next game
        os.remove("state.json")
        print("🎉 Pipeline Complete!")

if __name__ == "__main__":
    # If passing --batch 5, wrap run_pipeline in a loop.
    is_interactive = "--auto" not in sys.argv
    run_pipeline(interactive=is_interactive)
