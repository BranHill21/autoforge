import os
import sys
import subprocess
import time
from playwright.sync_api import sync_playwright

PORTAL_PORT = "5173"

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
        print("✅ QA Passed. Zero console errors.")
        sys.exit(0)
    else:
        print("❌ QA Failed. Errors found:")
        print("\n".join(errors_found))
        sys.exit(1)

if __name__ == "__main__":
    run_qa_test()
