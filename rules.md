---
description: 
globs: 
alwaysApply: true
---
# AI Agent Protocol: Self-Contained Mandatory Interactive Final Review Loop with Auto-Script Creation

## 1. Core Principle & Context:
Your primary task processing includes a **mandatory final interactive review stage** driven by user input through a specific Python script (`final_review_gate.py`). You are NOT to consider your overall task complete until this review stage explicitly signals completion. This protocol leverages your known capability to run commands in a sub-terminal (displayed within the chat interface) and read their output.

## Phase 1: Primary Task Execution
1.  Address the user's main request as you normally would: perform analysis, make code changes, call tools, and run applications/tests in sub-terminals if the main task requires it.
    * **Application Execution Confirmation:** Before attempting to run an entire application (e.g., a web server, a full front-end build, a long-running background process), you MUST ask the user for explicit confirmation. For example: "I am about to run the [application name/command]. Is it okay to proceed, or is it possibly already running?"
    * This confirmation is NOT required for running individual test scripts, linters, build tools for specific components, or other non-application-level commands necessary for task completion.
    * If the user indicates an application is already running or denies permission, adapt your strategy accordingly (e.g., focus on tests or specific file executions).
2.  Leverage your ability to read outputs/errors from these sub-terminals to make iterative fixes during *this* primary phase.

## Phase 2: Mandatory Final Interactive Review Script Execution
1.  **Transition Point:** Once you believe you have completed all substantive actions for the user's initial request (Phase 1), **DO NOT CONCLUDE THE CONVERSATION**. You MUST now transition to this Final Interactive Review phase.
2.  **Action:** Execute the `final_review_gate.py` script from the project root.
    * Determine the correct Python interpreter command (e.g., `python`, `python3`) available in the execution environment. A robust command attempt would be `python3 ./final_review_gate.py` and if that fails, try `python ./final_review_gate.py`.
    * **Crucially, the terminal for this script MUST run directly within the chat window, and its output MUST be continuously visible to the user as it is generated.** It must NOT pop open as a separate window or run hidden in the background. You MUST wait for the script (and its terminal interaction) to fully complete and exit before you proceed with any further actions or attempt to conclude the overall task. Your processing will be blocked by this script's execution.
3.  **Announcement:** Clearly inform the user: "I have completed the primary actions. Now initiating the mandatory Final Interactive Review by running `./final_review_gate.py`. The review terminal is now active **in this chat window, and its output will be displayed live**. Please provide any sub-prompts directly into that script's input area, or type 'TASK_COMPLETE', 'Done', 'Quit', or 'q' when satisfied." (MODIFIED: Removed "or simply press Enter")

## Phase 3: Interactive Review Loop (Monitoring Script Output)
1.  **Active Monitoring & Display:** Continuously monitor the standard output (stdout) of the launched `final_review_gate.py` script **as it appears live in the chat window**. Ensure the user sees all script output, including the `REVIEW_GATE_AWAITING_INPUT:` prompt. You will "read" its output using the same capability that allows you to read terminal logs or error messages. The script will loop and re-prompt if an empty input is given.
2.  **User Sub-Prompt Detection:** When the script's stdout prints a line formatted EXACTLY as:
    `USER_REVIEW_SUB_PROMPT: <user's sub-prompt text>`
    You MUST interpret `<user's sub-prompt text>` as a new, direct, actionable instruction from the user.
3.  **Processing Sub-Prompts:**
    a.  This instruction is a continuation or refinement of the *original, still-active task*.
    b.  Analyze the sub-prompt. Execute any necessary actions (code changes, new tool calls, file operations, etc.). **All tool calls made during this phase are part of the original request's tool call budget.** If the sub-prompt requests running an entire application, the confirmation principle from "Phase 1, Step 1 (Application Execution Confirmation)" applies.
    c.  Provide feedback or results of these actions in the main chat interface as you normally would for any AI action.
    d.  After processing the sub-prompt and giving feedback in the chat, IMMEDIATELY return your focus to monitoring the `final_review_gate.py` script's terminal output (which remains live and visible in the chat) for the next user instruction or completion signal. This loop is critical.

## Phase 4: True Task Conclusion
1.  Only after the `final_review_gate.py` script has terminated (as observed by its terminal session in the chat window closing and its final exit messages being printed and visible) are you permitted to consider the user's original request fully satisfied.
2.  You may then provide your final summary of all actions taken throughout all phases (including the interactive review).

## Overriding Default Behavior:
This entire "Final Interactive Review" process (Phases 0, 2, 3, and 4) is a **strict, non-negotiable requirement** that overrides any default tendency you have to end the conversation after completing Phase 1. The task is only finished when the user explicitly confirms with one of the specified keywords through the review script or the script otherwise terminates due to an error or EOF (as per the defined behavior, including the in-chat, blocking, and continuously visible terminal execution). Your "sense of completion" for the original request is deferred until this interactive review is done.