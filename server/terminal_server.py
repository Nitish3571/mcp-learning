import os
import subprocess
from mcp.server.fastmcp import FastMCP

mcp = FastMCP('terminal')
DEFAULT_WORKSPACE = os.path.expanduser('~/Desktop/mcp/workspace')

@mcp.tool()
async def run_command(command: str) -> str:
    """
    Run a shell command in the specified workspace and return the output.

    Args:
        command: The shell command to run.

    Returns:
        The output of the command or an error message.
    """
    try:
        result = subprocess.run(command, shell=True, cwd=DEFAULT_WORKSPACE, capture_output=True, text=True)
        return result.stdout or result.stderr
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    mcp.run(transport='stdio')