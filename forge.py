import os
import sys
import json
import subprocess
import time
import re
from google import genai
from google.genai import errors, types
from playwright.sync_api import sync_playwright

# ==========================================
# GLOBAL CONFIGURATION
# ==========================================
MODEL_FLASH = 'gemini-flash-lite-latest'
MODEL_PRO = 'gemini-3.5-flash'
PORTAL_PORT = "5173"

# Initialize Gemini Client
client = genai.Client()

def generate_with_retry(prompt, model=MODEL_FLASH, fallback_model=None, retries=5, delay=15, is_json=False):
    """Generates content with automatic backoff and model fallback for 503/429 errors."""
    config = types.GenerateContentConfig(response_mime_type="application/json") if is_json else None
    
    current_model = model
    for attempt in range(retries):
        try:
            return client.models.generate_content(
                model=current_model,
                contents=prompt,
                config=config
            ).text
        except errors.APIError as e:
            if "429" in str(e) or "503" in str(e):
                print(f"⏳ Rate limit or server busy on {current_model}. (Attempt {attempt + 1}/{retries})")
                
                # If we have a fallback model and we just failed on the main model, switch immediately
                if fallback_model and current_model != fallback_model:
                    print(f"🔄 Switching to fallback model: {fallback_model} to save quota...")
                    current_model = fallback_model
                    time.sleep(2) # Short wait before using fallback
                    continue
                    
                print(f"⏳ Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print(f"❌ Unrecoverable API Error: {e}")
                sys.exit(1)
    
    print("❌ Repeated API errors. Exiting pipeline safely. Try again later.")
    sys.exit(1)

def extract_js(text):
    """Safely extracts raw JavaScript from LLM markdown output."""
    match = re.search(r"```(?:javascript|js)?\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text.strip()

def load_state():
    if os.path.exists("state.json"):
        try:
            with open("state.json", "r") as f: return json.load(f)
        except json.JSONDecodeError:
            print("⚠️ state.json is corrupted. Starting fresh.")
    return {"status": "IDEATION", "game_name": "", "code": ""}

def save_state(state):
    with open("state.json", "w") as f: json.dump(state, f)

def run_qa_test():
    """Starts the dev server, runs the game in a headless browser, and catches errors."""
    # Ensure dependencies are installed
    if not os.path.exists("game-template/node_modules"):
        print("📦 Installing Node dependencies...")
        subprocess.run(["npm", "install"], cwd="game-template", stdout=subprocess.DEVNULL)

    print("🌐 Cleaning up old server processes...")
    if sys.platform == "darwin" or sys.platform == "linux":
        os.system(f"lsof -ti:{PORTAL_PORT} | xargs kill -9 2>/dev/null")

    print("🌐 Starting local Vite dev server...")
    # Start Vite on a strict port so it doesn't randomly change
    server_process = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", PORTAL_PORT, "--strictPort"],
        cwd="game-template",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(3) # Give Vite time to boot

    errors_found = []
    
    def log_console(msg):
        # We only care about actual errors, not standard logs or Vite HMR warnings
        if msg.type == "error" and "favicon" not in msg.text:
            errors_found.append(msg.text)

    def log_page_error(err):
        errors_found.append(err.message)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Attach error listeners
            page.on("console", log_console)
            page.on("pageerror", log_page_error)
            
            # Navigate to the game and wait for 10 seconds
            page.goto(f"http://localhost:{PORTAL_PORT}", timeout=10000)
            page.wait_for_timeout(10000)
            
            # Attempt to click the center of the screen and press common start keys to bypass the Start Menu
            try:
                canvas = page.locator("canvas").first
                if canvas:
                    canvas.click(timeout=2000)
                
                page.keyboard.press("Enter")
                page.keyboard.press("Space")
            except Exception:
                pass # Ignore if the start interaction fails
                
            # Wait for another 15 seconds to catch runtime errors during actual gameplay
            page.wait_for_timeout(15000)
            
            browser.close()
    except Exception as e:
        errors_found.append(str(e))
    finally:
        # Always kill the Vite server when done testing
        server_process.terminate()
        server_process.wait()

    if not errors_found:
        return True, ""
    
    return False, "\n".join(errors_found)

def run_pipeline(interactive=False):
    state = load_state()
    
    # PHASE 1: IDEATION
    if state["status"] == "IDEATION":
        print("💡 Generating Game Concept...")
        prompt = "Create a detailed concept for a highly addictive web game. DO NOT default to a basic platformer. Pick a random, distinct game genre (e.g., Puzzle, Top-down Shooter, Tower Defense, Space Invaders, Match-3, Idle Game, Action RPG, Physics Game). Include the core gameplay loop, distinct visual style, specific controls, and the flow from the start menu to game over."
        
        concept = generate_with_retry(prompt)
        
        # Extract a short name for the git commit
        state["game_name"] = concept.split('\n')[0].replace('"', '').strip()[:40]
        state["concept"] = concept
        state["status"] = "GDD_GEN"
        save_state(state)
        
        if interactive:
            input(f"\nConcept generated:\n{concept}\n\nPress Enter to approve or Ctrl+C to exit safely...")

    # PHASE 1.5: GAME DESIGN DOCUMENT (GDD)
    if state["status"] == "GDD_GEN":
        print("📋 Generating Game Design Document (GDD)...")
        gdd_prompt = f"You are a professional game designer. Expand this concept into a strict JSON Game Design Document:\n\n{state['concept']}\n\nThe JSON must include these keys:\n- 'core_loop': How the player plays.\n- 'juice': Mandatory visual/audio polish (particles, screen shake).\n- 'progression': How the game scales difficulty or unlocks.\n- 'ad_hooks': Where to trigger showInterstitialAd() and showRewardedAd().\n- 'assets': A list of required open-source Kenney.nl asset URLs.\n\nOutput ONLY valid JSON."
        
        gdd = generate_with_retry(gdd_prompt, model=MODEL_FLASH, is_json=True)
        state["gdd"] = gdd
        state["status"] = "CODE_GEN"
        save_state(state)
        
        if interactive:
            print(f"\nGDD Generated:\n{gdd}")
            input("\nPress Enter to continue to Code Generation...")

    # PHASE 2: CODE GENERATION
    if state["status"] == "CODE_GEN":
        print("⚙️ Writing Kaboom.js Code (using Gemini Pro)...")
        
        try:
            with open("kaboom_rules.md", "r") as f:
                rules = f.read()
        except FileNotFoundError:
            rules = ""
            
        gdd = state.get("gdd", state.get("concept", state["game_name"]))
        prompt = f"Write a complete, single-file Kaboom.js game based on this Game Design Document:\n\n{gdd}\n\nCRITICAL REQUIREMENTS:\n1. Follow the rules in this cheat sheet strictly:\n{rules}\n2. The game must be fully visualized using the requested Kenney.nl assets (load them via direct URLs).\n3. You must include a Start Menu, Game Over screen, Score tracking, and Instructions.\n4. Implement the Ad Hooks (`showInterstitialAd()`, `showRewardedAd()`) as placeholder console.log functions.\n5. Ensure all controls are fully functional and error-free. Initialize kaboom with `kaboom({{ width: 800, height: 600, letterbox: true }});` so it scales correctly on itch.io.\nOutput ONLY the raw javascript code, no markdown, no explanations."
        
        raw_output = generate_with_retry(prompt, model=MODEL_PRO, fallback_model=MODEL_FLASH)
        clean_code = extract_js(raw_output)
        
        os.makedirs("game-template", exist_ok=True)
        with open("game-template/main.js", "w") as f:
            f.write(clean_code)
            
        state["status"] = "LOCAL_REVIEW"
        save_state(state)

    # PHASE 2.5: LOCAL CODE REVIEW
    if state["status"] == "LOCAL_REVIEW":
        print("🔍 Performing Local Code Review...")
        with open("game-template/main.js", "r") as f:
            current_code = f.read()
            
        review_prompt = f"Please review this Kaboom.js game code for any missing elements (like Start/Game Over menus, visual assets, or instructions), logic flaws, or potential runtime errors that could come up later. If you find issues, fix them and improve the code. The game must be 100% playable from start to finish. Ensure it includes `import kaboom from 'kaboom';` and `kaboom({{ width: 800, height: 600, letterbox: true }});`.\n\nCurrent Code:\n{current_code}\n\nOutput ONLY the improved raw javascript code."
        
        print("🔄 Applying improvements from review...")
        reviewed_output = generate_with_retry(review_prompt, model=MODEL_FLASH)
        clean_reviewed_code = extract_js(reviewed_output)
        
        with open("game-template/main.js", "w") as f:
            f.write(clean_reviewed_code)
            
        state["status"] = "LOCAL_QA"
        save_state(state)

    # PHASE 3: AUTOMATED QA & SELF-HEALING LOOP
    if state["status"] == "LOCAL_QA":
        print("🤖 Running Headless Browser Tests...")
        max_qa_retries = 10
        qa_passed = False
        
        for qa_attempt in range(max_qa_retries):
            passed, err_msg = run_qa_test()
            
            if passed:
                qa_passed = True
                break
            else:
                print(f"⚠️ QA Failed (Attempt {qa_attempt + 1}/{max_qa_retries}). Errors found:\n{err_msg}")
                print("🔄 Asking AI to fix the code...")
                
                with open("game-template/main.js", "r") as f:
                    current_code = f.read()
                    
                try:
                    with open("kaboom_rules.md", "r") as f:
                        rules = f.read()
                except FileNotFoundError:
                    rules = ""
                
                fix_prompt = f"The following Kaboom.js game code threw these errors in the browser console:\n\n{err_msg}\n\nHere is the current code:\n{current_code}\n\nStrict Rules:\n{rules}\n\nPlease fix the errors and output the corrected full single-file javascript code. IMPORTANT: Retain all existing features, menus, instructions, and visual elements. Do not strip functionality while fixing errors. Ensure it includes `import kaboom from 'kaboom';` and `kaboom({{ width: 800, height: 600, letterbox: true }});`. Output ONLY the raw javascript code."
                
                raw_fixed_output = generate_with_retry(fix_prompt, model=MODEL_FLASH)
                clean_fixed_code = extract_js(raw_fixed_output)
                
                with open("game-template/main.js", "w") as f:
                    f.write(clean_fixed_code)
                    
        if qa_passed:
            print("✅ QA Passed. Zero console errors.")
            state["status"] = "PLAYABILITY_EVAL"
            save_state(state)
        else:
            print("❌ QA Failed repeatedly. Exiting pipeline to allow manual inspection.")
            sys.exit(1)

    # PHASE 3.2: PLAYABILITY EVALUATION
    if state["status"] == "PLAYABILITY_EVAL":
        print("🧠 Performing AI Playability & Bounds Review...")
        with open("game-template/main.js", "r") as f:
            current_code = f.read()
            
        try:
            with open("kaboom_rules.md", "r") as f:
                rules = f.read()
        except FileNotFoundError:
            rules = ""
            
        playability_prompt = f"Review this Kaboom.js game code strictly for unbeatable states, unwinnable scenarios, missing win-conditions, math/bounds overflows (e.g. generating more items than can physically fit in a grid or on screen), or soft-locks.\n\nRules:\n{rules}\n\nCurrent Code:\n{current_code}\n\nIf you find any logic flaws that could make the game unbeatable or overflow UI/grid bounds, fix them and output the improved raw javascript code. If the code is perfectly safe, output the code unmodified. Ensure it includes `import kaboom from 'kaboom';` and `kaboom({{ width: 800, height: 600, letterbox: true }});`.\nOutput ONLY the raw javascript code."
        
        print("🔄 Applying playability improvements...")
        reviewed_output = generate_with_retry(playability_prompt, model=MODEL_FLASH)
        clean_reviewed_code = extract_js(reviewed_output)
        
        with open("game-template/main.js", "w") as f:
            f.write(clean_reviewed_code)
            
        print("🤖 Running Post-Improvement QA...")
        passed, err_msg = run_qa_test()
        
        if passed:
            print("✅ Playability Review and QA Complete.")
            state["status"] = "GENERATE_INSTRUCTIONS"
            save_state(state)
        else:
            print(f"⚠️ Playability changes introduced errors:\n{err_msg}")
            print("🔄 Routing back to Automated QA for self-healing...")
            state["status"] = "LOCAL_QA"
            save_state(state)
            return run_pipeline(interactive)

    # PHASE 3.5: GENERATE INSTRUCTIONS
    if state["status"] == "GENERATE_INSTRUCTIONS":
        print("📝 Generating instructions.txt for itch.io...")
        with open("game-template/main.js", "r") as f:
            final_code = f.read()
            
        instructions_prompt = f"Read the following completed game code and write a short, engaging description and instructions manual suitable for an itch.io page. Include a brief summary, how to play, and controls.\n\nCode:\n{final_code}\n\nOutput only the text content for the instructions file."
        
        instructions = generate_with_retry(instructions_prompt, model=MODEL_FLASH)
        
        with open("game-template/instructions.txt", "w") as f:
            f.write(instructions.strip())
            
        print("✅ instructions.txt generated.")
        state["status"] = "GITHUB_PUSH"
        save_state(state)

    # PHASE 4: GITHUB DEPLOYMENT
    if state["status"] == "GITHUB_PUSH":
        print("🚀 Pushing to GitHub for CI/CD Deployment...")
        subprocess.run(["git", "add", "."])
        
        # Clean the commit message to prevent Git errors from weird characters
        clean_name = re.sub(r'[^a-zA-Z0-9 ]', '', state['game_name'])[:40]
        subprocess.run(["git", "commit", "-m", f"Auto-Deploy: {clean_name}..."])
        subprocess.run(["git", "push", "origin", "main"])
        
        # Reset state for the next game
        if os.path.exists("state.json"):
            os.remove("state.json")
        print("🎉 Pipeline Complete!")

if __name__ == "__main__":
    is_interactive = "--auto" not in sys.argv
    
    if "--new" in sys.argv:
        print("🗑️  --new flag detected. Wiping previous state...")
        for file in ["state.json", "game-template/main.js", "game-template/instructions.txt"]:
            if os.path.exists(file):
                os.remove(file)
    elif os.path.exists("state.json"):
        print("▶️  Resuming from previous state. (Run with --new to start fresh).")
    
    # If the user passes --batch N, run it N times.
    batch_count = 1
    if "--batch" in sys.argv:
        try:
            idx = sys.argv.index("--batch")
            batch_count = int(sys.argv[idx + 1])
        except (ValueError, IndexError):
            pass

    for i in range(batch_count):
        if batch_count > 1:
            print(f"\n==========================================")
            print(f"🎮 Starting Game {i + 1} of {batch_count}")
            print(f"==========================================\n")
        run_pipeline(interactive=is_interactive)
        
        # Give the system a brief moment to reset ports before looping
        if i < batch_count - 1:
            time.sleep(2)
