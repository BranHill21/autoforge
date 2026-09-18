from playwright.sync_api import sync_playwright
import subprocess
import time
import sys

PORTAL_PORT = "5173"
server_process = subprocess.Popen(
    ["npm", "run", "dev", "--", "--port", PORTAL_PORT, "--strictPort"],
    cwd="game-template",
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)
time.sleep(2)

errors_found = []
def log_console(msg):
    if msg.type == "error":
        errors_found.append(msg.text)
def log_page_error(err):
    errors_found.append(err.message)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", log_console)
    page.on("pageerror", log_page_error)
    page.goto(f"http://localhost:{PORTAL_PORT}", timeout=10000)
    page.wait_for_timeout(3000)
    browser.close()

server_process.terminate()
if errors_found:
    print("ERRORS:", "\n".join(errors_found))
    sys.exit(1)
print("NO ERRORS")
