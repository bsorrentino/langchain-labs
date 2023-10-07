import subprocess
def run_workflow():
    subprocess.run(["streamlit", "run", "streamlit_agent/chat_workflow.py", "--server.port", "8051"] )