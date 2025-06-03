// Defines the DevTool type and a list of available tools.

export interface DevTool {
  name: string;
  description: string;
}

export const AVAILABLE_TOOLS: DevTool[] = [
  {
    name: 'ls',
    description:
      'ls(directory_path: str = "") -> list[str]: lists git-tracked files/directories under the given directory in the repo (defaults to repo root).',
  },
  {
    name: 'read_files',
    description:
      'read_files(filepaths: list[str]) -> list[str]: returns the content of the following files in the repo. It will not work for files outside the repo. For example `/dev/null` or `/bin/bash` will not work. It can return FileNotFoundError if a file does not exist, please run `ls()` and only use valid files.',
  },
  {
    name: 'view_text_website',
    description:
      'view_text_website(url: str) -> str: fetches the content of a website as plain text. Useful for accessing documentation or external resources. This tool only works when the sandbox has internet access.',
  },
  {
    name: 'create_file_with_block',
    description:
      'A special tool! Use this to create a new file. If the directory does not exist, it will be created. It is one of the few tools that are called using a DSL (described below), NOT A FUNCTION CALL. **This tool is language-agnostic; you can create files of any programming language, configuration files, or plain text.**',
  },
  {
    name: 'overwrite_file_with_block',
    description:
      'A special tool! Use this to overwrite an existing file. It is one of the few tools that are called using a DSL (described below), NOT A FUNCTION CALL. **This tool is language-agnostic; you can overwrite files of any programming language, configuration files, or plain text.**',
  },
  {
    name: 'delete_file',
    description:
      'delete_file(filepath: str) -> str: deletes a file. If the file does not exist, it will return an error message.',
  },
  {
    name: 'rename_file',
    description:
      'rename_file(filepath: str, new_filepath: str) -> str: renames and/or moves files and directories like `mv` in bash. It will return an error message if `filepath` is missing, if `new_filepath` already exists, or if the target parent directory does not exist.',
  },
  {
    name: 'grep',
    description: 'grep(pattern: str) -> str: runs grep for the given pattern.',
  },
  {
    name: 'replace_with_git_merge_diff',
    description:
      'A special tool! Use this to make any edits to the codebase. It is one of the few tools that are specified as a DSL (described below), NOT A FUNCTION CALL. Do not use this tool to create new files. **This tool is language-agnostic and can be used to modify files of any programming language, configuration files, or plain text.**',
  },
  {
    name: 'reset_all',
    description:
      'reset_all() -> None: Resets the entire codebase to its original state. Use this tool to undo all your changes and start over.',
  },
  {
    name: 'restore_file',
    description:
      'restore_file(filepath: str) -> None: Restores the given file to its original state. Use this tool to undo all your changes to a specific file.',
  },
  {
    name: 'run_in_bash_session',
    description:
      'A special tool! Runs the given bash command in the sandbox in a bash session. Successive invocations of this tool use the same bash session. Note the usage examples below; this uses plain bash syntax, NOT A FUNCTION CALL. **You are expected and able to use this tool to install necessary dependencies (e.g., using `sudo apt-get install -y <package>`, `npm install`, `pip install`) and compile code as needed for your subtask. Do not tell the user to perform these actions; it is your responsibility.**',
  },
  {
    name: 'submit_subtask_report',
    description:
      'submit_subtask_report(summary: str, succeeded: bool) -> None: Submits the report for the current subtask.',
  },
];
