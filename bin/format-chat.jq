#!/usr/bin/env -S jq -rj -f

# Helper function to truncate long strings
def truncate_string(str; max_length):
  if str | length > max_length then
    str[0:max_length] + "..."
  else
    str
  end;

# Helper function to clean text content:
# - Remove ANSI escape codes (colors, formatting)
# - Convert literal \n to actual newlines
# - Clean up other escaped characters
def clean_text:
  # Remove ANSI escape codes (e.g. \u001b[32m, \e[0m, etc.)
  gsub("\\u001b\\[[0-9;]*[a-zA-Z]"; "") |
  gsub("\\\\u001b\\[[0-9;]*[a-zA-Z]"; "") |
  gsub("\\\\e\\[[0-9;]*[a-zA-Z]"; "") |
  gsub("\u001b\\[[0-9;]*[a-zA-Z]"; "") |
  # Convert literal backslash-n to newline
  gsub("\\\\n"; "\n") |
  # Convert literal backslash-t to tab
  gsub("\\\\t"; "\t") |
  # Clean up escaped quotes
  gsub("\\\\\""; "\"");

# Helper function to format arguments with truncation
def format_args(args):
  if args == null then
    ""
  else
    " " + (args | to_entries | map(
      if .value | type == "string" then
        "\(.key): \"\(.value | truncate_string(50))\""
      elif .value | type == "array" then
        "\(.key): [\(.value | length) items]"
      elif .value | type == "object" then
        "\(.key): {\(.value | keys | length) fields}"
      else
        "\(.key): \(.value)"
      end
    ) | join(", "))
  end;

# Helper function to colorize diff output
# Green (32) for added lines (+), Red (31) for removed lines (-), dim for context
def colorize_diff:
  split("\n") | map(
    if startswith("+") then
      "\u001b[32m\(.)\u001b[0m"
    elif startswith("-") then
      "\u001b[31m\(.)\u001b[0m"
    else
      "\u001b[90m\(.)\u001b[0m"
    end
  ) | join("\n");

if .type == "system" and .subtype == "init" then
  "\u001b[90m[SESSION]\u001b[0m \(.model) | \(.permissionMode)\n"
elif .type == "user" then
  # Don't output user message content - it can interfere with completion detection
  # when the prompt itself contains markers like <promise>COMPLETE</promise>
  "\n\u001b[36m[USER]\u001b[0m (prompt omitted)\n\n\u001b[32m[ASSISTANT]\u001b[0m "
elif .type == "assistant" then
  # Only output streaming token chunks (have timestamp_ms but NO model_call_id)
  # Messages with model_call_id are consolidated duplicates of already-streamed text
  if .timestamp_ms and (.model_call_id | not) then
    (.message.content[0].text // "" | clean_text)
  else
    empty
  end
# Tool call format: ⬢ Bold_Tool_Name dim_path
# Colors by risk level:
# - Red (91): DELETE - destructive, highest risk
# - Yellow (33): SHELL, WRITE, EDIT - modifies system/files
# - Blue (34): READ, LS, GLOB, GREP - read-only, safe
# - Magenta (35): TODO - planning/metadata
# - Cyan (36): Unknown TOOL - neutral
# ANSI codes: \u001b[1m = bold, \u001b[90m = dim gray, \u001b[0m = reset
# Spacing: tool_start has \n\n before (blank line after assistant text), tool_complete has \n\n after (blank line before next content)
elif .type == "tool_call" and .subtype == "started" then
  if .tool_call.shellToolCall then
    "\n\n  \u001b[33m⬢ \u001b[1mShell\u001b[0m \u001b[90m\(.tool_call.shellToolCall.args.command)\u001b[0m\n"
  elif .tool_call.readToolCall then
    "\n\n  \u001b[34m⬢ \u001b[1mRead\u001b[0m \u001b[90m\(.tool_call.readToolCall.args.path)\(if .tool_call.readToolCall.args.offset then " (offset: \(.tool_call.readToolCall.args.offset), limit: \(.tool_call.readToolCall.args.limit))" else "" end)\u001b[0m\n"
  elif .tool_call.editToolCall then
    "\n\n  \u001b[33m⬢ \u001b[1mEdit\u001b[0m \u001b[90m\(.tool_call.editToolCall.args.path)\u001b[0m\n"
  elif .tool_call.grepToolCall then
    "\n\n  \u001b[34m⬢ \u001b[1mGrep\u001b[0m \u001b[90m\(.tool_call.grepToolCall.args.pattern) in \(.tool_call.grepToolCall.args.path)\u001b[0m\n"
  elif .tool_call.lsToolCall then
    "\n\n  \u001b[34m⬢ \u001b[1mList\u001b[0m \u001b[90m\(.tool_call.lsToolCall.args.path)\(if .tool_call.lsToolCall.args.ignore and (.tool_call.lsToolCall.args.ignore | length) > 0 then " (ignore: \(.tool_call.lsToolCall.args.ignore | join(", ")))" else "" end)\u001b[0m\n"
  elif .tool_call.globToolCall then
    "\n\n  \u001b[34m⬢ \u001b[1mGlob\u001b[0m \u001b[90m\(.tool_call.globToolCall.args.globPattern) in \(.tool_call.globToolCall.args.targetDirectory)\u001b[0m\n"
  elif .tool_call.todoToolCall then
    "\n\n  \u001b[35m⬢ \u001b[1mTodo\u001b[0m \u001b[90m\(.tool_call.todoToolCall.args.merge // false | if . then "merge" else "create" end) \(.tool_call.todoToolCall.args.todos | length) todos\u001b[0m" + 
    (if .tool_call.todoToolCall.args.todos and (.tool_call.todoToolCall.args.todos | length) > 0 then
      "\n  " + (.tool_call.todoToolCall.args.todos | map(
        (.status // "unknown" | if . == "TODO_STATUS_PENDING" then "⏳" elif . == "TODO_STATUS_IN_PROGRESS" then "🔄" elif . == "TODO_STATUS_COMPLETED" then "✅" elif . == "TODO_STATUS_CANCELLED" then "❌" else "❓" end) + " " + .content
      ) | join("\n  "))
    else "" end) + "\n"
  elif .tool_call.updateTodosToolCall then
    "\n\n  \u001b[35m⬢ \u001b[1mUpdateTodos\u001b[0m \u001b[90m\(.tool_call.updateTodosToolCall.args.merge // false | if . then "merge" else "create" end) \(.tool_call.updateTodosToolCall.args.todos | length) todos\u001b[0m" + 
    (if .tool_call.updateTodosToolCall.args.todos and (.tool_call.updateTodosToolCall.args.todos | length) > 0 then
      "\n  " + (.tool_call.updateTodosToolCall.args.todos | map(
        (.status // "unknown" | if . == "TODO_STATUS_PENDING" then "⏳" elif . == "TODO_STATUS_IN_PROGRESS" then "🔄" elif . == "TODO_STATUS_COMPLETED" then "✅" elif . == "TODO_STATUS_CANCELLED" then "❌" else "❓" end) + " " + .content
      ) | join("\n  "))
    else "" end) + "\n"
  elif .tool_call.writeToolCall then
    "\n\n  \u001b[33m⬢ \u001b[1mWrite\u001b[0m \u001b[90m\(.tool_call.writeToolCall.args.path) (\(.tool_call.writeToolCall.args.fileText | length) chars)\u001b[0m\n    " + (.tool_call.writeToolCall.args.fileText | clean_text | if length > 100 then .[0:100] + "..." else . end) + "\n"
  elif .tool_call.deleteToolCall then
    "\n\n  \u001b[91m⬢ \u001b[1mDelete\u001b[0m \u001b[90m\(.tool_call.deleteToolCall.args.path)\u001b[0m\n"
  else
    "\n\n  \u001b[36m⬢ \u001b[1m\(.tool_call | keys[0])\u001b[0m" + 
    (if .tool_call | to_entries[0].value.args then
      " \u001b[90m" + (.tool_call | to_entries[0].value.args | to_entries | map(
        if .value | type == "string" then
          "\(.key): \"\(.value | if length > 50 then .[0:50] + "..." else . end)\""
        elif .value | type == "array" then
          "\(.key): [\(.value | length) items]"
        elif .value | type == "object" then
          "\(.key): {\(.value | keys | length) fields}"
        else
          "\(.key): \(.value)"
        end
      ) | join(", ")) + "\u001b[0m"
    else "" end) + "\n"
  end
# Tool completion - \n\n after (blank line before assistant text that may follow)
elif .type == "tool_call" and .subtype == "completed" then
  if .tool_call.shellToolCall then
    if .tool_call.shellToolCall.result.success then
      "  \u001b[90m✓ Exit \(.tool_call.shellToolCall.result.success.exitCode)\u001b[0m\n\n"
    else
      "  \u001b[91m✗ Failed\u001b[0m\n\n"
    end
  elif .tool_call.readToolCall then
    if .tool_call.readToolCall.result.success then
      "  \u001b[90m✓ Read \(.tool_call.readToolCall.result.success.totalLines) lines\u001b[0m\n\n"
    else
      "  \u001b[91m✗ Read failed\u001b[0m\n\n"
    end
  elif .tool_call.editToolCall then
    if .tool_call.editToolCall.result.success then
      "  \u001b[90m✓ Edited (\u001b[32m+\(.tool_call.editToolCall.result.success.linesAdded)\u001b[90m/\u001b[31m-\(.tool_call.editToolCall.result.success.linesRemoved)\u001b[90m)\u001b[0m\n" +
      (if .tool_call.editToolCall.result.success.diffString then
        "    \(.tool_call.editToolCall.result.success.diffString | colorize_diff | gsub("\n"; "\n    "))\n\n"
      else
        "\n"
      end)
    else
      "  \u001b[91m✗ Edit failed\u001b[0m\n\n"
    end
  elif .tool_call.grepToolCall then
    if .tool_call.grepToolCall.result.success then
      "  \u001b[90m✓ Found \(.tool_call.grepToolCall.result.success.workspaceResults | to_entries[0].value.content.totalMatchedLines) matches\u001b[0m\n\n"
    else
      "  \u001b[91m✗ Grep failed\u001b[0m\n\n"
    end
  elif .tool_call.lsToolCall then
    if .tool_call.lsToolCall.result.success then
      "  \u001b[90m✓ Listed \(.tool_call.lsToolCall.result.success.directoryTreeRoot.childrenFiles | length) files, \(.tool_call.lsToolCall.result.success.directoryTreeRoot.childrenDirs | length) dirs\u001b[0m\n\n"
    else
      "  \u001b[91m✗ List failed\u001b[0m\n\n"
    end
  elif .tool_call.globToolCall then
    if .tool_call.globToolCall.result.success then
      "  \u001b[90m✓ Found \(.tool_call.globToolCall.result.success.totalFiles) files\u001b[0m\n\n"
    else
      "  \u001b[91m✗ Glob failed\u001b[0m\n\n"
    end
  elif .tool_call.todoToolCall then
    if .tool_call.todoToolCall.result.success then
      "  \u001b[90m✓ Updated todos\u001b[0m" + 
      (if .tool_call.todoToolCall.result.success.todos and (.tool_call.todoToolCall.result.success.todos | length) > 0 then
        "\n  " + (.tool_call.todoToolCall.result.success.todos | map(
          (.status // "unknown" | if . == "TODO_STATUS_PENDING" then "⏳" elif . == "TODO_STATUS_IN_PROGRESS" then "🔄" elif . == "TODO_STATUS_COMPLETED" then "✅" elif . == "TODO_STATUS_CANCELLED" then "❌" else "❓" end) + " " + .content
        ) | join("\n  "))
      else "" end) + "\n\n"
    else
      "  \u001b[91m✗ Todo update failed\u001b[0m\n\n"
    end
  elif .tool_call.updateTodosToolCall then
    if .tool_call.updateTodosToolCall.result.success then
      "  \u001b[90m✓ Updated todos\u001b[0m" + 
      (if .tool_call.updateTodosToolCall.result.success.todos and (.tool_call.updateTodosToolCall.result.success.todos | length) > 0 then
        "\n  " + (.tool_call.updateTodosToolCall.result.success.todos | map(
          (.status // "unknown" | if . == "TODO_STATUS_PENDING" then "⏳" elif . == "TODO_STATUS_IN_PROGRESS" then "🔄" elif . == "TODO_STATUS_COMPLETED" then "✅" elif . == "TODO_STATUS_CANCELLED" then "❌" else "❓" end) + " " + .content
        ) | join("\n  "))
      else "" end) + "\n\n"
    else
      "  \u001b[91m✗ Todo update failed\u001b[0m\n\n"
    end
  elif .tool_call.writeToolCall then
    if .tool_call.writeToolCall.result.success then
      "  \u001b[90m✓ Wrote \(.tool_call.writeToolCall.result.success.linesCreated) lines (\(.tool_call.writeToolCall.result.success.fileSize) bytes)\u001b[0m\n\n"
    else
      "  \u001b[91m✗ Write failed\u001b[0m\n\n"
    end
  elif .tool_call.deleteToolCall then
    if .tool_call.deleteToolCall.result.success then
      "  \u001b[90m✓ Deleted\u001b[0m\n\n"
    elif .tool_call.deleteToolCall.result.rejected then
      "  \u001b[91m✗ Delete rejected: \(.tool_call.deleteToolCall.result.rejected.reason // "unknown reason")\u001b[0m\n\n"
    else
      "  \u001b[91m✗ Delete failed\u001b[0m\n\n"
    end
  else
    "  \u001b[90m✓ Completed\u001b[0m\n\n"
  end
elif .type == "result" then
  "\n\n\u001b[35m[RESULT]\u001b[0m \(.subtype) (\(.duration_ms)ms)\n"
else
  empty
end
