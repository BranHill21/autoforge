import os
import sys
import json
import subprocess
import time
import re
import ollama
from google import genai
from google.genai import errors
from playwright.sync_api import sync_playwright

# ==========================================
# GLOBAL CONFIGURATION
# ==========================================
MODEL_NAME = 'gemini-3.8-flash'
PORTAL_PORT = "5173"

# Initialize Gemini Client
client = genai.Client()

def generate_with_retry(prompt, retries=5, delay=15):
    """Generates content with automatic backoff for 503 Server Unavailable errors."""
    for attempt in range(retries):
        try:
            return client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            ).text
        except errors.ServerError:
            print(f"⏳ Server busy (503). Retrying in {delay} seconds (Attempt {attempt + 1}/{retries})...")
            time.sleep(delay)
    
    print("❌ Server consistently busy. Exiting pipeline safely. Try again later.")
    sys.exit(1)
    
def generate_with_ollama(prompt, model_name='qwen2.5-coder:7b'):
    """Generates content using the local Ollama model."""
    response = ollama.chat(model=model_name, messages=[
        {
            'role': 'user',
            'content': prompt,
        }
    ])
    return response['message']['content']

def extract_js(text):
    """Safely extracts raw JavaScript from LLM markdown output."""
    match = re.search(r"```(?:javascript|js)?\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text.strip()

def load_state():
    if os.path.exists("state.json"):
        with open("state.json", "r") as f: return json.load(f)
    return {"status": "IDEATION", "game_name": "", "code": ""}

def save_state(state):
    with open("state.json", "w") as f: json.dump(state, f)

def run_qa_test():
    """Starts the dev server, runs the game in a headless browser, and catches errors."""
    # Ensure dependencies are installed
    if not os.path.exists("game-template/node_modules"):
        print("📦 Installing Node dependencies...")
        subprocess.run(["npm", "install"], cwd="game-template", stdout=subprocess.DEVNULL)

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
            
            # Navigate to the game and wait for 3 seconds to let game logic run
            page.goto(f"http://localhost:{PORTAL_PORT}", timeout=10000)
            page.wait_for_timeout(3000)
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
        prompt = "Create a detailed concept for a highly addictive, arcade-style HTML5 web game. Include the core gameplay loop, distinct visual style, specific controls, and the flow from the start menu to game over."
        
        concept = generate_with_retry(prompt)
        
        # Extract a short name for the git commit
        state["game_name"] = concept.split('\n')[0].replace('"', '').strip()[:40]
        state["concept"] = concept
        state["status"] = "CODE_GEN"
        save_state(state)
        
        if interactive:
            input(f"\nConcept generated:\n{concept}\n\nPress Enter to approve or Ctrl+C to exit safely...")

    # PHASE 2: CODE GENERATION
    if state["status"] == "CODE_GEN":
        print("⚙️ Writing Kaboom.js Code...")
        game_concept = state.get("concept", state["game_name"])
        prompt = f"Write a complete, single-file Kaboom.js game based on this concept:\n\n'{game_concept}'\n\nCRITICAL REQUIREMENTS:\n1. The game must be fully visualized and implemented.\n2. You must include a Start Menu, a Game Over screen, and Score tracking.\n3. Include an on-screen instructions overlay or text.\n4. Ensure all controls are fully functional and error-free.\n5. Import kaboom at the top using `import kaboom from 'kaboom';`. Initialize it with `kaboom();`.\nOutput ONLY the raw javascript code, no markdown, no explanations."
        
        raw_output = generate_with_ollama(prompt)
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
            
        review_prompt = f"Please review this Kaboom.js game code for any missing elements (like Start/Game Over menus, visual assets, or instructions), logic flaws, or potential runtime errors that could come up later. If you find issues, fix them and improve the code. The game must be 100% playable from start to finish. Ensure it includes `import kaboom from 'kaboom';` and `kaboom();`.\n\nCurrent Code:\n{current_code}\n\nOutput ONLY the improved raw javascript code."
        
        print("🔄 Applying improvements from review...")
        reviewed_output = generate_with_ollama(review_prompt)
        clean_reviewed_code = extract_js(reviewed_output)
        
        with open("game-template/main.js", "w") as f:
            f.write(clean_reviewed_code)
            
        state["status"] = "LOCAL_QA"
        save_state(state)

    # PHASE 3: AUTOMATED QA & SELF-HEALING LOOP
    if state["status"] == "LOCAL_QA":
        print("🤖 Running Headless Browser Tests...")
        max_qa_retries = 3
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
                
                fix_prompt = f"The following Kaboom.js game code threw these errors in the browser console:\n\n{err_msg}\n\nHere is the current code:\n{current_code}\n\nPlease fix the errors and output the corrected full single-file javascript code. IMPORTANT: Retain all existing features, menus, instructions, and visual elements. Do not strip functionality while fixing errors. Ensure it includes `import kaboom from 'kaboom';` and `kaboom();`. Output ONLY the raw javascript code."
                
                raw_fixed_output = generate_with_ollama(fix_prompt)
                clean_fixed_code = extract_js(raw_fixed_output)
                
                with open("game-template/main.js", "w") as f:
                    f.write(clean_fixed_code)
                    
        if qa_passed:
            print("✅ QA Passed. Zero console errors.")
            state["status"] = "GENERATE_INSTRUCTIONS"
            save_state(state)
        else:
            print("❌ QA Failed repeatedly. Exiting pipeline to allow manual inspection.")
            sys.exit(1)

    # PHASE 3.5: GENERATE INSTRUCTIONS
    if state["status"] == "GENERATE_INSTRUCTIONS":
        print("📝 Generating instructions.txt for itch.io...")
        with open("game-template/main.js", "r") as f:
            final_code = f.read()
            
        instructions_prompt = f"Read the following completed game code and write a short, engaging description and instructions manual suitable for an itch.io page. Include a brief summary, how to play, and controls.\n\nCode:\n{final_code}\n\nOutput only the text content for the instructions file."
        
        instructions = generate_with_ollama(instructions_prompt)
        
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
